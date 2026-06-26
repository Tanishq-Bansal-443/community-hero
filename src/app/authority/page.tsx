"use client";

import { useEffect, useMemo, useState } from "react";
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
const IssueMap = dynamic(
    () => import("@/components/IssueMap"),
    {
        ssr: false,
    }
);

type Report = {
    id: string;
    imageUrl: string;
    issueType: string;
    severity: string;
    description: string;
    latitude: number;
    longitude: number;
    status: "reported" | "under_review" | "resolved";
    communityReports?: number;
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

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<
        "all" | "reported" | "under_review" | "resolved"
    >("all");

    const [sortBy, setSortBy] = useState<
        "newest" | "severity" | "community"
    >("newest");

    const [center, setCenter] = useState<
        [number, number]
    >([30.901, 75.857]);

    // Helper functions (matching Citizen Dashboard)
    function formatStatus(status: string): string {
        return status
            .replace("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function getSeverityColor(severity: string): string {
        switch (severity) {
            case "Severe":
                return "text-red-400";
            case "High":
                return "text-orange-400";
            case "Medium":
                return "text-yellow-400";
            case "Low":
                return "text-green-400";
            default:
                return "text-slate-400";
        }
    }

    function getStatusBadgeColor(status: string): string {
        switch (status) {
            case "reported":
                return "bg-amber-500/20 text-amber-300";
            case "under_review":
                return "bg-blue-500/20 text-blue-300";
            case "resolved":
                return "bg-green-500/20 text-green-300";
            default:
                return "bg-slate-800 text-slate-300";
        }
    }

    function getFraudRiskColor(risk: string): string {
        switch (risk?.toLowerCase()) {
            case "high":
                return "text-red-400";
            case "medium":
                return "text-yellow-400";
            case "low":
                return "text-green-400";
            default:
                return "text-slate-400";
        }
    }

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter([
                    position.coords.latitude,
                    position.coords.longitude,
                ]);
            },
            () => { }
        );

        const q = query(
            collection(db, "reports"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReports(
                snapshot.docs.map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                        }) as Report
                )
            );

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const totalReports = reports.length;

    const reportedCount = reports.filter(
        (r) => r.status === "reported"
    ).length;

    const underReviewCount = reports.filter(
        (r) => r.status === "under_review"
    ).length;

    const resolvedCount = reports.filter(
        (r) => r.status === "resolved"
    ).length;

    const severeCount = reports.filter(
        (r) => r.severity === "Severe"
    ).length;

    const communityReports = reports.reduce(
        (sum, report) =>
            sum + (report.communityReports ?? 1),
        0
    );

    const aiVerified = reports.filter(
        (r) =>
            r.verificationConfidence !== null &&
            r.verificationConfidence !== undefined
    ).length;

    // FIXED: sortBy is now applied!
    const filteredReports = useMemo(() => {
        let data = [...reports];

        // Apply status filter
        if (statusFilter !== "all") {
            data = data.filter(
                (r) => r.status === statusFilter
            );
        }

        // Apply search filter
        if (search.trim()) {
            const term = search.toLowerCase();
            data = data.filter(
                (r) =>
                    r.issueType
                        .toLowerCase()
                        .includes(term) ||
                    r.description
                        .toLowerCase()
                        .includes(term)
            );
        }

        // Apply sorting
        if (sortBy === "severity") {
            const order: Record<string, number> = {
                Severe: 4,
                High: 3,
                Medium: 2,
                Low: 1,
            };

            data.sort(
                (a, b) =>
                    (order[b.severity] ?? 0) -
                    (order[a.severity] ?? 0)
            );
        } else if (sortBy === "community") {
            data.sort(
                (a, b) =>
                    (b.communityReports ?? 1) -
                    (a.communityReports ?? 1)
            );
        }
        // "newest" is already sorted from Firestore query

        return data;
    }, [reports, search, statusFilter, sortBy]);

    // Placeholder functions for button actions
    function handleReview(reportId: string) {
        console.log("Review report:", reportId);
        // TODO: Open detail view or modal
    }

    function handleMarkUnderReview(reportId: string) {
        console.log("Mark under review:", reportId);
        // TODO: Update Firestore status to "under_review"
    }

    function handleUploadRepair(reportId: string) {
        console.log("Upload repair for:", reportId);
        // TODO: Open file upload dialog
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <section className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
                <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <p className="text-cyan-400 uppercase tracking-[0.35em] text-sm font-semibold">
                            AUTHORITY OPERATIONS
                        </p>

                        <h1 className="text-5xl font-bold mt-4">
                            Community Hero
                            Control Center
                        </h1>

                        <p className="text-slate-400 mt-5 max-w-2xl leading-8">
                            Monitor community reports,
                            prioritize severe incidents,
                            verify repairs with AI and
                            coordinate municipal response
                            from a single operational
                            dashboard.
                        </p>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <Link
                            href="/dashboard"
                            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
                        >
                            Citizen Portal
                        </Link>

                        <Link
                            href="/report"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition"
                        >
                            Report Issue
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-2 lg:grid-cols-6 gap-5">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                    <p className="text-slate-400 text-sm">
                        Total Reports
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {totalReports}
                    </h2>
                </div>

                <div className="bg-amber-500/10 rounded-2xl border border-amber-500/30 p-5">
                    <p className="text-amber-300 text-sm">
                        Reported
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {reportedCount}
                    </h2>
                </div>

                <div className="bg-blue-500/10 rounded-2xl border border-blue-500/30 p-5">
                    <p className="text-blue-300 text-sm">
                        Under Review
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {underReviewCount}
                    </h2>
                </div>

                <div className="bg-red-500/10 rounded-2xl border border-red-500/30 p-5">
                    <p className="text-red-300 text-sm">
                        High Priority
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {severeCount}
                    </h2>
                </div>

                <div className="bg-green-500/10 rounded-2xl border border-green-500/30 p-5">
                    <p className="text-green-300 text-sm">
                        Resolved
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {resolvedCount}
                    </h2>
                </div>

                <div className="bg-cyan-500/10 rounded-2xl border border-cyan-500/30 p-5">
                    <p className="text-cyan-300 text-sm">
                        Community Reports
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {communityReports}
                    </h2>
                </div>
            </section>

            {/* AI Insights + Filters */}
            <section className="max-w-7xl mx-auto px-8 grid lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">

                    <div className="flex items-center justify-between mb-5">

                        <div>

                            <h2 className="text-2xl font-bold">
                                AI Operational Insights
                            </h2>

                            <p className="text-slate-400 mt-2">
                                Live operational summary generated
                                from incoming civic reports.
                            </p>

                        </div>

                        <span className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-300 text-sm">
                            Live
                        </span>

                    </div>

                    <div className="grid md:grid-cols-2 gap-5">

                        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5">

                            <h3 className="font-semibold text-lg">
                                Critical Attention
                            </h3>

                            <p className="text-slate-400 mt-3 leading-7">
                                {severeCount} severe issue
                                {severeCount === 1 ? "" : "s"} currently
                                require immediate municipal action.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5">

                            <h3 className="font-semibold text-lg">
                                Community Verification
                            </h3>

                            <p className="text-slate-400 mt-3 leading-7">
                                Citizens have submitted{" "}
                                {communityReports} confirmations
                                across all reported incidents.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5">

                            <h3 className="font-semibold text-lg">
                                AI Verification
                            </h3>

                            <p className="text-slate-400 mt-3 leading-7">
                                {aiVerified} repairs have already
                                been validated through Gemini.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5">

                            <h3 className="font-semibold text-lg">
                                Operations Status
                            </h3>

                            <p className="text-slate-400 mt-3 leading-7">
                                {underReviewCount} reports are
                                currently being processed by
                                municipal authorities.
                            </p>

                        </div>

                    </div>

                </div>

                {/* Filters Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

                    <h2 className="text-2xl font-bold">
                        Operations Filters
                    </h2>

                    <div className="mt-6 space-y-5">

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search issue..."
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-cyan-500"
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as any
                                )
                            }
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
                        >
                            <option value="all">
                                All Reports
                            </option>

                            <option value="reported">
                                Reported
                            </option>

                            <option value="under_review">
                                Under Review
                            </option>

                            <option value="resolved">
                                Resolved
                            </option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(
                                    e.target.value as
                                    | "newest"
                                    | "severity"
                                    | "community"
                                )
                            }
                            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
                        >
                            <option value="newest">
                                Sort: Newest
                            </option>

                            <option value="severity">
                                Sort: Severity
                            </option>

                            <option value="community">
                                Sort: Community Reports
                            </option>
                        </select>

                        <div className="border-t border-slate-800 pt-5">

                            <h3 className="font-semibold mb-4">
                                Live Overview
                            </h3>

                            <div className="space-y-4 text-sm">

                                <div className="flex justify-between">

                                    <span className="text-slate-400">
                                        Total Incidents
                                    </span>

                                    <span className="font-semibold">
                                        {totalReports}
                                    </span>

                                </div>

                                <div className="flex justify-between">

                                    <span className="text-slate-400">
                                        Active Cases
                                    </span>

                                    <span className="font-semibold text-amber-400">
                                        {reportedCount +
                                            underReviewCount}
                                    </span>

                                </div>

                                <div className="flex justify-between">

                                    <span className="text-slate-400">
                                        AI Verified Repairs
                                    </span>

                                    <span className="font-semibold text-cyan-400">
                                        {aiVerified}
                                    </span>

                                </div>

                                <div className="flex justify-between">

                                    <span className="text-slate-400">
                                        Resolved
                                    </span>

                                    <span className="font-semibold text-green-400">
                                        {resolvedCount}
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* Live Map */}
            <section className="max-w-7xl mx-auto px-8 mt-8">

                <div className="flex items-center justify-between mb-5">

                    <div>

                        <h2 className="text-2xl font-bold">
                            Live Incident Map
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Monitor all reported civic issues
                            across the community in real time.
                        </p>

                    </div>

                    <div className="flex items-center gap-4 text-sm">

                        <div className="flex items-center gap-2">

                            <div className="w-3 h-3 rounded-full bg-red-500"></div>

                            <span className="text-slate-400">
                                Severe
                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>

                            <span className="text-slate-400">
                                High
                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <div className="w-3 h-3 rounded-full bg-green-500"></div>

                            <span className="text-slate-400">
                                Resolved
                            </span>

                        </div>

                    </div>

                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                    <IssueMap
                        reports={filteredReports}
                        center={center}
                    />
                </div>

            </section>

            {/* Incident Queue */}
            <section className="max-w-7xl mx-auto px-8 py-10">

                <div className="flex items-center justify-between mb-8">

                    <div>

                        <h2 className="text-3xl font-bold">
                            Incident Queue
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Review, prioritize and resolve
                            incoming civic reports.
                        </p>

                    </div>

                    <span className="rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-sm">
                        {filteredReports.length} Reports
                    </span>

                </div>

                <div className="grid lg:grid-cols-2 gap-8">

                    {loading ? (
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 flex items-center justify-center">
                            <p className="text-slate-400 text-lg">
                                Loading reports...
                            </p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 flex items-center justify-center">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold">
                                    No Reports Found
                                </h3>

                                <p className="text-slate-400 mt-3">
                                    Try changing your filters or
                                    search query.
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-cyan-500 transition-all duration-300"
                            >
                                <img
                                    src={report.imageUrl}
                                    alt={report.issueType}
                                    className="w-full h-64 object-cover"
                                />

                                <div className="p-6">

                                    <div className="flex justify-between items-start">

                                        <div>

                                            <h3 className="text-2xl font-bold">
                                                {report.issueType}
                                            </h3>

                                            <p className="text-slate-400 mt-2 line-clamp-3">
                                                {report.description}
                                            </p>

                                        </div>

                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                                                report.status
                                            )}`}
                                        >
                                            {formatStatus(report.status)}
                                        </span>

                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6">

                                        <div className="bg-slate-800 rounded-xl p-4">

                                            <p className="text-xs uppercase text-slate-500 tracking-wide">
                                                Severity
                                            </p>

                                            <p
                                                className={`font-bold mt-2 ${getSeverityColor(
                                                    report.severity
                                                )}`}
                                            >
                                                {report.severity}
                                            </p>

                                        </div>

                                        <div className="bg-slate-800 rounded-xl p-4">

                                            <p className="text-xs uppercase text-slate-500 tracking-wide">
                                                Community Reports
                                            </p>

                                            <p className="font-bold mt-2">
                                                👥{" "}
                                                {report.communityReports ??
                                                    1}
                                            </p>

                                        </div>

                                        {/* FIXED: Combined coordinates */}
                                        <div className="bg-slate-800 rounded-xl p-4 col-span-2">

                                            <p className="text-xs uppercase text-slate-500 tracking-wide">
                                                Location
                                            </p>

                                            <p className="font-semibold mt-2 text-sm">
                                                📍{" "}
                                                {report.latitude.toFixed(
                                                    5
                                                )}
                                                ,{" "}
                                                {report.longitude.toFixed(
                                                    5
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                    {/* AI Analysis Section */}
                                    <div className="mt-6">

                                        <div className="flex items-center justify-between">

                                            <h4 className="font-semibold">
                                                AI Analysis
                                            </h4>

                                            {report.verificationConfidence ? (
                                                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                                                    VERIFIED
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                                                    PENDING
                                                </span>
                                            )}

                                        </div>

                                        <div className="mt-4 bg-slate-800 rounded-2xl border border-slate-700 p-4">

                                            <div className="flex justify-between">

                                                <span className="text-slate-400">
                                                    Confidence
                                                </span>

                                                <span className="font-semibold">
                                                    {report.verificationConfidence ??
                                                        "--"}
                                                    {report.verificationConfidence
                                                        ? "%"
                                                        : ""}
                                                </span>

                                            </div>

                                            <div className="flex justify-between mt-3">

                                                <span className="text-slate-400">
                                                    Fraud Risk
                                                </span>

                                                <span
                                                    className={`font-semibold ${getFraudRiskColor(
                                                        report.fraudRisk || ""
                                                    )}`}
                                                >
                                                    {report.fraudRisk ||
                                                        "N/A"}
                                                </span>

                                            </div>

                                            {report.verificationReason && (
                                                <div className="mt-4 border-t border-slate-700 pt-4">

                                                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                                                        Gemini Reasoning
                                                    </p>

                                                    <p className="text-sm text-slate-300 leading-6">
                                                        {
                                                            report.verificationReason
                                                        }
                                                    </p>

                                                </div>
                                            )}

                                        </div>

                                    </div>

                                    {/* Action Buttons - Wired up with placeholder functions */}
                                    <div className="mt-8 flex flex-wrap gap-3">

                                        <button
                                            onClick={() =>
                                                handleReview(report.id)
                                            }
                                            className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-500 transition rounded-xl py-3 font-semibold"
                                        >
                                            Review
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleMarkUnderReview(
                                                    report.id
                                                )
                                            }
                                            className="flex-1 min-w-[140px] bg-amber-500 hover:bg-amber-400 text-slate-950 transition rounded-xl py-3 font-semibold"
                                        >
                                            Mark Under Review
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleUploadRepair(
                                                    report.id
                                                )
                                            }
                                            className="flex-1 min-w-[170px] bg-green-600 hover:bg-green-500 transition rounded-xl py-3 font-semibold"
                                        >
                                            Upload Repair
                                        </button>

                                    </div>

                                </div>

                            </div>
                        ))
                    )}

                </div>

            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 mt-10">

                <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-6">

                    <div>

                        <h3 className="text-xl font-bold">
                            Community Hero
                        </h3>

                        <p className="text-slate-400 mt-2">
                            AI Powered Municipal Operations Center
                        </p>

                    </div>

                    <div className="flex gap-4">

                        <Link
                            href="/dashboard"
                            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
                        >
                            Citizen Dashboard
                        </Link>

                        <Link
                            href="/report"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition"
                        >
                            New Report
                        </Link>

                    </div>

                </div>

            </footer>

        </main>
    );
}