"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
} from "@/lib/cloudinary";
import dynamic from "next/dynamic";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";

const IssueMap = dynamic(() => import("@/components/IssueMap"), {
    ssr: false,
});

type Report = {
    id: string;
    imageUrl: string;
    issueType: string;
    severity: string;
    description: string;
    latitude: number;
    longitude: number;
    status: "reported" | "under_review" | "resolved" | "disputed";
    affectedCount: number;
    communityReports: number;
    confirmedBy: string[];
    verificationConfidence?: number | null;
    verificationReason?: string;
    fraudRisk?: string;
    repairImageUrl?: string;
    resolvedAt?: any;
    createdAt?: any;
};

export default function AuthorityDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        "all" | "reported" | "under_review" | "resolved"
    >("all");
    const [sortBy, setSortBy] = useState<"newest" | "severity" | "community" | "affected">("newest");
    const [center, setCenter] = useState<[number, number]>([30.901, 75.857]);
    const repairInputRef = useRef<HTMLInputElement>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    // ===== PAGINATION STATE =====
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Helper functions
    function formatStatus(status: string): string {
        return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function getSeverityColor(severity: string): string {
        switch (severity) {
            case "Severe": return "text-red-400";
            case "High": return "text-orange-400";
            case "Medium": return "text-yellow-400";
            case "Low": return "text-green-400";
            default: return "text-slate-400";
        }
    }

    function getStatusBadgeColor(status: string): string {
        switch (status) {
            case "reported": return "bg-amber-500/30 text-amber-300";
            case "under_review": return "bg-blue-500/30 text-blue-300";
            case "resolved": return "bg-green-500/30 text-green-300";
            case "disputed": return "bg-red-500/30 text-red-300";
            default: return "bg-slate-800 text-slate-300";
        }
    }

    function getFraudRiskColor(risk: string): string {
        switch (risk?.toLowerCase()) {
            case "high": return "text-red-400";
            case "medium": return "text-yellow-400";
            case "low": return "text-green-400";
            default: return "text-slate-400";
        }
    }

    function getSeverityBadge(severity: string): string {
        switch (severity) {
            case "Severe": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "High": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "Low": return "bg-green-500/20 text-green-400 border-green-500/30";
            default: return "bg-slate-700 text-slate-300 border-slate-600";
        }
    }

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter([position.coords.latitude, position.coords.longitude]);
            },
            () => { }
        );

        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReports(
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Report[]
            );
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ===== FULLY DYNAMIC STATS =====
    const totalReports = reports.length;
    const reportedCount = reports.filter((r) => r.status === "reported").length;
    const underReviewCount = reports.filter((r) => r.status === "under_review").length;
    const resolvedCount = reports.filter((r) => r.status === "resolved").length;
    const disputedCount = reports.filter((r) => r.status === "disputed").length;

    // Severe stats
    const severeCount = reports.filter((r) => r.severity === "Severe").length;
    const severeUnresolved = reports.filter(
        (r) => r.severity === "Severe" && r.status !== "resolved"
    ).length;
    const severeResolved = reports.filter(
        (r) => r.severity === "Severe" && r.status === "resolved"
    ).length;

    // Community stats
    const communityReports = reports.reduce((sum, report) => sum + (report.communityReports ?? 1), 0);
    const totalAffected = reports.reduce((sum, r) => sum + (r.affectedCount || 0), 0);

    // AI stats
    const aiVerified = reports.filter(
        (r) => r.verificationConfidence !== null && r.verificationConfidence !== undefined
    ).length;
    const aiVerificationRate = totalReports > 0 ? Math.round((aiVerified / totalReports) * 100) : 0;

    // Fraud stats
    const highFraudRisk = reports.filter((r) => r.fraudRisk?.toLowerCase() === "high").length;
    const mediumFraudRisk = reports.filter((r) => r.fraudRisk?.toLowerCase() === "medium").length;
    const lowFraudRisk = reports.filter((r) => r.fraudRisk?.toLowerCase() === "low").length;
    const totalFraudAnalyzed = reports.filter((r) => r.fraudRisk).length;

    // Derived
    const activeCases = reportedCount + underReviewCount;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

    // Filtered Reports
    const filteredReports = useMemo(() => {
        let data = [...reports];
        if (statusFilter !== "all") {
            data = data.filter((r) => r.status === statusFilter);
        }
        if (sortBy === "severity") {
            const order: Record<string, number> = { Severe: 4, High: 3, Medium: 2, Low: 1 };
            data.sort((a, b) => (order[b.severity] ?? 0) - (order[a.severity] ?? 0));
        } else if (sortBy === "community") {
            data.sort((a, b) => (b.communityReports ?? 1) - (a.communityReports ?? 1));
        } else if (sortBy === "affected") {
            data.sort((a, b) => (b.affectedCount || 0) - (a.affectedCount || 0));
        }
        return data;
    }, [reports, statusFilter, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(start, start + itemsPerPage);
    }, [filteredReports, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, sortBy]);

    function handleReview(reportId: string) {
        setExpandedReportId((prev) => (prev === reportId ? null : reportId));
    }

    async function handleMarkUnderReview(reportId: string) {
        try {
            await updateDoc(doc(db, "reports", reportId), {
                status: "under_review",
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Failed to update report:", error);
        }
    }

    function handleUploadRepair(reportId: string) {
        setSelectedReportId(reportId);
        repairInputRef.current?.click();
    }

    async function handleRepairImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !selectedReportId) return;

        try {
            const report = reports.find((r) => r.id === selectedReportId);
            if (!report) return;

            // 1. Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );
            const uploadData = await uploadResponse.json();

            // 2. Verify with Gemini (with retry)
            let verifyData = null;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const verifyResponse = await fetch("/api/verify-repair", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            reportId: selectedReportId,
                            originalImageUrl: report.imageUrl,
                            repairImageUrl: uploadData.secure_url,
                        }),
                    });
                    verifyData = await verifyResponse.json();

                    if (verifyData.success) break;

                    attempts++;
                    if (attempts < maxAttempts) {
                        console.log(`Retry ${attempts}/${maxAttempts}...`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                    }
                } catch (retryError) {
                    attempts++;
                    console.log(`Attempt ${attempts} failed, retrying...`);
                    if (attempts >= maxAttempts) throw retryError;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            if (!verifyData?.success) {
                alert("AI verification failed after multiple attempts. Please try again.");
                return;
            }

            const analysis = verifyData.analysis;
            await updateDoc(doc(db, "reports", selectedReportId), {
                repairImageUrl: uploadData.secure_url,
                verificationConfidence: analysis.confidence,
                verificationReason: analysis.reason,
                fraudRisk: analysis.fraudRisk,
                status: analysis.resolved ? "resolved" : "disputed",
                resolvedAt: analysis.resolved ? serverTimestamp() : null,
                updatedAt: serverTimestamp(),
            });

            alert(
                analysis.resolved
                    ? "✅ Issue verified and marked as Resolved."
                    : "⚠ Repair disputed by AI."
            );
        } catch (error) {
            console.error(error);
            alert("Error processing repair. Please try again.");
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            {/* ===== HEADER ===== */}
            <section className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <p className="text-cyan-400 uppercase tracking-[0.35em] text-sm font-semibold">
                            AUTHORITY OPERATIONS
                        </p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 leading-tight">
                            Community Hero Control Center
                        </h1>
                        <p className="text-slate-300 mt-5 max-w-2xl leading-relaxed">
                            Monitor community reports, prioritize severe incidents, verify repairs with AI and
                            coordinate municipal response from a single operational dashboard.
                        </p>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                        <Link
                            href="/dashboard"
                            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition hover:scale-105 active:scale-95 text-slate-300 hover:text-white"
                        >
                            Citizen Portal
                        </Link>
                        <Link
                            href="/report"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25"
                        >
                            Report Issue
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== STATS CARDS ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-5 shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-105">
                        <p className="text-slate-400 text-sm font-medium">Total Reports</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{totalReports}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 rounded-2xl border border-amber-500/30 p-5 shadow-xl hover:shadow-amber-500/10 transition-all duration-300 hover:scale-105">
                        <p className="text-amber-300 text-sm font-medium">Reported</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{reportedCount}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-2xl border border-blue-500/30 p-5 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
                        <p className="text-blue-300 text-sm font-medium">Under Review</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{underReviewCount}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl border border-red-500/30 p-5 shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:scale-105">
                        <p className="text-red-300 text-sm font-medium">Severe Issues</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{severeCount}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 rounded-2xl border border-green-500/30 p-5 shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:scale-105">
                        <p className="text-green-300 text-sm font-medium">Resolved</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{resolvedCount}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 rounded-2xl border border-cyan-500/30 p-5 shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-105">
                        <p className="text-cyan-300 text-sm font-medium">Total Impact</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{totalAffected}</h2>
                        <p className="text-xs text-cyan-400/70 mt-0.5">citizens affected</p>
                    </div>
                </div>
            </section>

            {/* ===== AI INSIGHTS + FILTERS ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">AI Operational Insights</h2>
                            <p className="text-slate-300 mt-2">
                                {reports.length === 0
                                    ? "No reports yet. Community is looking good! 🎉"
                                    : `Live operational summary from ${reports.length} reports.`}
                            </p>
                        </div>
                        <span className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-semibold flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            {reports.length === 0 ? "Idle" : "Live"}
                        </span>
                    </div>

                    {reports.length === 0 ? (
                        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-8 text-center">
                            <p className="text-slate-400 text-lg">No data to display yet. Reports will appear here as citizens submit them.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-5">
                            {/* Card 1: Severe Summary */}
                            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5 hover:border-cyan-500/30 transition-all">
                                <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                                    {severeCount > 0 ? "🔴" : "🟢"} Severe Issues
                                </h3>
                                <div className="mt-3">
                                    <p className="text-slate-300 leading-relaxed">
                                        {severeCount === 0 && "No severe issues reported. Community is safe! ✅"}

                                        {severeCount > 0 && (
                                            <>
                                                <span className="text-white font-bold">{severeCount}</span> severe issue{severeCount === 1 ? "" : "s"} reported.

                                                {severeUnresolved === 0 && severeResolved > 0 && (
                                                    <span className="block mt-2 text-green-400">
                                                        ✅ All severe issues have been resolved! ({severeResolved} resolved)
                                                    </span>
                                                )}

                                                {severeUnresolved > 0 && (
                                                    <span className="block mt-2 text-amber-400">
                                                        ⚠️ {severeUnresolved} severe issue{severeUnresolved === 1 ? "" : "s"} still {severeUnresolved === 1 ? "requires" : "require"} immediate municipal action.
                                                        {severeResolved > 0 && ` (${severeResolved} resolved)`}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Community Engagement */}
                            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5 hover:border-cyan-500/30 transition-all">
                                <h3 className="font-semibold text-lg text-white">👥 Community Engagement</h3>
                                <div className="mt-3">
                                    <p className="text-slate-300 leading-relaxed">
                                        <span className="text-white font-bold">{communityReports}</span> confirmations across
                                        <span className="text-white font-bold"> {reports.length}</span> report{reports.length === 1 ? "" : "s"}.
                                        {reports.length > 0 && (
                                            <span className="block mt-1 text-slate-400 text-sm">
                                                Average {Math.round(communityReports / reports.length)} confirmations per report
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: AI Verification */}
                            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5 hover:border-cyan-500/30 transition-all">
                                <h3 className="font-semibold text-lg text-white">🤖 AI Verification</h3>
                                <div className="mt-3">
                                    <p className="text-slate-300 leading-relaxed">
                                        {aiVerified === 0 && "No reports have been AI verified yet. Upload repair evidence to get started."}

                                        {aiVerified > 0 && (
                                            <>
                                                <span className="text-white font-bold">{aiVerificationRate}%</span> of reports verified by Gemini
                                                <span className="block text-sm text-slate-400">
                                                    ({aiVerified} of {reports.length} reports)
                                                </span>
                                                {aiVerificationRate >= 80 && (
                                                    <span className="block mt-2 text-green-400">✅ Excellent AI coverage!</span>
                                                )}
                                                {aiVerificationRate >= 50 && aiVerificationRate < 80 && (
                                                    <span className="block mt-2 text-yellow-400">📊 Good coverage, keep going!</span>
                                                )}
                                                {aiVerificationRate < 50 && aiVerificationRate > 0 && (
                                                    <span className="block mt-2 text-blue-400">📈 Upload more repair evidence to improve verification rate.</span>
                                                )}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Card 4: Fraud Detection */}
                            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5 hover:border-cyan-500/30 transition-all">
                                <h3 className="font-semibold text-lg text-white">🛡️ Fraud Detection</h3>
                                <div className="mt-3">
                                    <p className="text-slate-300 leading-relaxed">
                                        {totalFraudAnalyzed === 0 && "No fraud analysis has been performed yet."}

                                        {totalFraudAnalyzed > 0 && (
                                            <>
                                                {highFraudRisk > 0 && (
                                                    <span className="block text-red-400">
                                                        🚨 {highFraudRisk} high-risk case{highFraudRisk === 1 ? "" : "s"} flagged
                                                    </span>
                                                )}
                                                {mediumFraudRisk > 0 && (
                                                    <span className="block text-yellow-400">
                                                        ⚠️ {mediumFraudRisk} medium-risk case{mediumFraudRisk === 1 ? "" : "s"}
                                                    </span>
                                                )}
                                                {lowFraudRisk > 0 && (
                                                    <span className="block text-green-400">
                                                        ✅ {lowFraudRisk} low-risk case{lowFraudRisk === 1 ? "" : "s"} verified
                                                    </span>
                                                )}
                                                {disputedCount > 0 && (
                                                    <span className="block mt-2 text-red-400">
                                                        ⚠️ {disputedCount} dispute{disputedCount === 1 ? "" : "s"} pending review
                                                    </span>
                                                )}
                                                {highFraudRisk === 0 && mediumFraudRisk === 0 && lowFraudRisk === 0 && disputedCount === 0 && totalFraudAnalyzed > 0 && (
                                                    <span className="block text-green-400">✅ All analyzed reports show low fraud risk!</span>
                                                )}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-white">Operations Filters</h2>
                    <div className="mt-6 space-y-5">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                        >
                            <option value="all">All Reports ({reports.length})</option>
                            <option value="reported">Reported ({reportedCount})</option>
                            <option value="under_review">Under Review ({underReviewCount})</option>
                            <option value="resolved">Resolved ({resolvedCount})</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "newest" | "severity" | "community" | "affected")}
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                        >
                            <option value="newest">Sort: Newest</option>
                            <option value="severity">Sort: Severity</option>
                            <option value="community">Sort: Community Reports</option>
                            <option value="affected">Sort: Most Affected</option>
                        </select>

                        <div className="border-t border-slate-800 pt-5">
                            <h3 className="font-semibold text-white mb-4">Live Overview</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total Incidents</span>
                                    <span className="font-semibold text-white">{totalReports}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Active Cases</span>
                                    <span className="font-semibold text-amber-400">{activeCases}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Resolution Rate</span>
                                    <span className="font-semibold text-green-400">{resolutionRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">AI Verified</span>
                                    <span className="font-semibold text-cyan-400">{aiVerified}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Resolved</span>
                                    <span className="font-semibold text-green-400">{resolvedCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Disputed</span>
                                    <span className="font-semibold text-red-400">{disputedCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== LIVE MAP ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Live Incident Map</h2>
                        <p className="text-slate-300 mt-2">Monitor all reported civic issues across the community in real time.</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-300">Severe</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-slate-300">High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-300">Resolved</span>
                        </div>
                    </div>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
                    <IssueMap reports={filteredReports} center={center} />
                </div>
            </section>

            {/* ===== INCIDENT QUEUE WITH PAGINATION ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Incident Queue</h2>
                        <p className="text-slate-300 mt-2">Review, prioritize and resolve incoming civic reports.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white">
                            {filteredReports.length} Reports
                        </span>
                        {totalPages > 1 && (
                            <span className="rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400">
                                Page {currentPage} of {totalPages}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {loading ? (
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 flex items-center justify-center">
                            <p className="text-slate-300 text-lg">Loading reports...</p>
                        </div>
                    ) : paginatedReports.length === 0 ? (
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 flex items-center justify-center">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white">No Reports Found</h3>
                                <p className="text-slate-300 mt-3">Try changing your filters.</p>
                            </div>
                        </div>
                    ) : (
                        paginatedReports.map((report) => {
                            const isExpanded = expandedReportId === report.id;
                            return (
                                <div
                                    key={report.id}
                                    className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl ${isExpanded
                                        ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                                        : "border-slate-800 hover:border-cyan-500/50"
                                        }`}
                                >
                                    <img
                                        src={report.imageUrl}
                                        alt={report.issueType}
                                        className="w-full h-48 sm:h-56 md:h-64 object-cover"
                                    />

                                    <div className="p-5 sm:p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl sm:text-2xl font-bold text-white">{report.issueType}</h3>
                                                <p className={`text-slate-300 mt-2 ${isExpanded ? "" : "line-clamp-3"}`}>
                                                    {report.description}
                                                </p>
                                            </div>
                                            <span
                                                className={`shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                                                    report.status
                                                )}`}
                                            >
                                                {formatStatus(report.status)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadge(report.severity)}`}>
                                                {report.severity}
                                            </span>
                                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                                                👥 {report.affectedCount || 0} affected
                                            </span>
                                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                                                📸 {report.communityReports || 1} reports
                                            </span>
                                            {report.verificationConfidence && (
                                                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/30">
                                                    🤖 {report.verificationConfidence}%
                                                </span>
                                            )}
                                            {report.fraudRisk && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${report.fraudRisk.toLowerCase() === "high"
                                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                    : report.fraudRisk.toLowerCase() === "medium"
                                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                        : "bg-green-500/20 text-green-400 border-green-500/30"
                                                    }`}>
                                                    ⚠️ {report.fraudRisk} risk
                                                </span>
                                            )}
                                        </div>

                                        {/* EXPANDED VIEW */}
                                        {isExpanded && (
                                            <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
                                                <div className="bg-slate-800 rounded-xl p-4">
                                                    <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Full Description</p>
                                                    <p className="text-slate-300">{report.description}</p>
                                                    <div className="mt-3 text-sm text-slate-400">
                                                        📍 {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                                                    </div>
                                                </div>

                                                {report.repairImageUrl && (
                                                    <div>
                                                        <h4 className="font-semibold text-white mb-3">Before & After Comparison</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Original Report</p>
                                                                <img
                                                                    src={report.imageUrl}
                                                                    alt="Original"
                                                                    className="w-full h-40 object-cover rounded-xl border border-slate-700"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Repair Evidence</p>
                                                                <img
                                                                    src={report.repairImageUrl}
                                                                    alt="Repair"
                                                                    className="w-full h-40 object-cover rounded-xl border border-emerald-600"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-slate-800 rounded-xl p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">AI Analysis</p>
                                                        {report.verificationConfidence ? (
                                                            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                                                                🤖 Verified
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">Pending</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Confidence</span>
                                                            <span className="font-semibold text-white">
                                                                {report.verificationConfidence ?? "--"}
                                                                {report.verificationConfidence ? "%" : ""}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Fraud Risk</span>
                                                            <span className={`font-semibold ${getFraudRiskColor(report.fraudRisk || "")}`}>
                                                                {report.fraudRisk || "N/A"}
                                                            </span>
                                                        </div>
                                                        {report.verificationReason && (
                                                            <div className="border-t border-slate-700 pt-3 mt-3">
                                                                <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-1">AI Reasoning</p>
                                                                <p className="text-sm text-slate-300">{report.verificationReason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ACTION BUTTONS */}
                                        <div className="mt-8 flex flex-wrap gap-3">
                                            <button
                                                onClick={() => handleReview(report.id)}
                                                className={`flex-1 min-w-[140px] rounded-xl py-3 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${isExpanded
                                                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
                                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                                    }`}
                                            >
                                                {isExpanded ? "Close Review" : "Review"}
                                            </button>

                                            {report.status === "reported" && (
                                                <button
                                                    onClick={() => handleMarkUnderReview(report.id)}
                                                    className="flex-1 min-w-[170px] bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl py-3 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25"
                                                >
                                                    Mark Under Review
                                                </button>
                                            )}

                                            {report.status === "under_review" && (
                                                <button
                                                    onClick={() => handleUploadRepair(report.id)}
                                                    className="w-full bg-green-600 hover:bg-green-500 transition-all duration-300 rounded-xl py-3 font-semibold text-white shadow-lg shadow-green-500/25 hover:scale-105 active:scale-95"
                                                >
                                                    Upload Repair Evidence
                                                </button>
                                            )}

                                            {report.status === "resolved" && (
                                                <div className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-center py-3 font-semibold">
                                                    ✅ Issue Successfully Closed
                                                </div>
                                            )}

                                            {report.status === "disputed" && (
                                                <>
                                                    <div className="w-full rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-center py-3 font-semibold">
                                                        ⚠ AI could not verify this repair
                                                    </div>
                                                    <button
                                                        onClick={() => handleUploadRepair(report.id)}
                                                        className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-xl py-3 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25"
                                                    >
                                                        Upload New Repair Evidence
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ===== PAGINATION CONTROLS ===== */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-10">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${currentPage === 1
                                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                : "bg-slate-800 hover:bg-slate-700 text-white hover:scale-105 active:scale-95"
                                }`}
                        >
                            ← Previous
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl font-semibold transition-all duration-300 ${currentPage === pageNum
                                            ? "bg-cyan-500 text-slate-950 scale-105 shadow-lg shadow-cyan-500/25"
                                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white hover:scale-105 active:scale-95"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <span className="flex items-center text-slate-500">…</span>
                            )}
                        </div>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${currentPage === totalPages
                                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                : "bg-slate-800 hover:bg-slate-700 text-white hover:scale-105 active:scale-95"
                                }`}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>

            {/* Hidden file input */}
            <input
                ref={repairInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleRepairImageSelected}
            />

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-slate-800 mt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="text-center lg:text-left">
                        <h3 className="text-xl font-bold text-white">Community Hero</h3>
                        <p className="text-slate-400 mt-2">AI Powered Municipal Operations Center</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition text-slate-300 hover:text-white hover:scale-105 active:scale-95"
                        >
                            Citizen Dashboard
                        </Link>
                        <Link
                            href="/report"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95"
                        >
                            New Report
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}