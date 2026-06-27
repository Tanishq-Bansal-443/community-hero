"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcons, resolvedIcon } from "@/lib/markerIcons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { confirmIssue } from "@/lib/services/report.service";
import Link from "next/link";

type Report = {
    id: string;
    issueType: string;
    severity: string;
    status: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    description: string;
    affectedCount: number;
    communityReports: number;
    confirmedBy: string[];
    verificationConfidence?: number | null;
};

export default function IssueMap({
    reports,
    center,
}: {
    reports: Report[];
    center: [number, number];
}) {
    const { user } = useAuth();
    const router = useRouter();

    const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
    const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
    const [confirmedReports, setConfirmedReports] = useState<Set<string>>(new Set());

    // Initialize confirmedReports with any existing confirmations from server
    useEffect(() => {
        if (!user) return;
        const userConfirmedIds = reports
            .filter((r) => (r.confirmedBy ?? []).includes(user.uid))
            .map((r) => r.id);
        if (userConfirmedIds.length > 0) {
            setConfirmedReports((prev) => {
                const next = new Set(prev);
                userConfirmedIds.forEach((id) => next.add(id));
                return next;
            });
        }
    }, [reports, user]);

    async function handleConfirm(report: Report) {
        if (!user) {
            router.push("/auth");
            return;
        }

        if (confirmedReports.has(report.id) || (report.confirmedBy ?? []).includes(user.uid)) {
            alert("You have already confirmed this issue.");
            return;
        }

        try {
            setLoadingReportId(report.id);

            const success = await confirmIssue(report.id, user.uid);

            if (!success) {
                alert("Already confirmed.");
                return;
            }

            setLocalCounts((prev) => ({
                ...prev,
                [report.id]: (prev[report.id] ?? report.affectedCount) + 1,
            }));

            setConfirmedReports((prev) => {
                const next = new Set(prev);
                next.add(report.id);
                return next;
            });
        } catch (error) {
            console.error(error);
            alert("Failed to confirm issue.");
        } finally {
            setLoadingReportId(null);
        }
    }

    // Empty state
    if (!reports || reports.length === 0) {
        return (
            <div className="relative h-72 sm:h-96 md:h-[450px] w-full rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-6 text-center border border-slate-200 dark:border-white/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No issues reported yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Be the first to report a civic issue in your community.
                </p>
                <Link
                    href="/report"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition hover:scale-105 active:scale-95"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Report Issue
                </Link>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-white/10">
            <MapContainer
                center={center}
                zoom={15}
                className="h-72 sm:h-96 md:h-[450px] w-full"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        icon={
                            report.status === "resolved"
                                ? resolvedIcon
                                : markerIcons[report.severity as keyof typeof markerIcons] ??
                                markerIcons.Medium
                        }
                        position={[report.latitude, report.longitude]}
                    >
                        <Popup maxWidth={320} minWidth={220} className="custom-popup" autoPan>
                            <div className="relative">
                                <img
                                    src={report.imageUrl}
                                    alt={report.issueType}
                                    className="w-full h-44 object-cover rounded-t-xl"
                                    loading="lazy"
                                />

                                <span
                                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-lg ${report.status === "resolved"
                                        ? "bg-emerald-500"
                                        : report.status === "under_review"
                                            ? "bg-amber-500"
                                            : report.status === "reported"
                                                ? "bg-red-500"
                                                : "bg-gray-500"
                                        }`}
                                >
                                    {report.status.replace("_", " ")}
                                </span>

                                {report.status === "resolved" && report.verificationConfidence && (
                                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm">
                                        🤖 AI Verified {report.verificationConfidence}%
                                    </span>
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                        {report.issueType}
                                    </h3>

                                    <span
                                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${report.severity === "Severe"
                                            ? "bg-red-600"
                                            : report.severity === "High"
                                                ? "bg-orange-500"
                                                : report.severity === "Medium"
                                                    ? "bg-yellow-500"
                                                    : "bg-green-600"
                                            }`}
                                    >
                                        {report.severity}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                    {report.description}
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Evidence</p>
                                        <p className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                            📸 {report.communityReports}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Affected</p>
                                        <p className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                            👥 {localCounts[report.id] ?? report.affectedCount}
                                        </p>
                                    </div>
                                </div>

                                {report.status === "resolved" && (
                                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                                        <span>✅</span>
                                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                            AI Verified Repair
                                            {report.verificationConfidence
                                                ? ` (${report.verificationConfidence}% confidence)`
                                                : ""}
                                        </span>
                                    </div>
                                )}

                                {report.status === "disputed" && (
                                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
                                        <span>⚠️</span>
                                        <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                            AI Disputed – Needs Review
                                        </span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                                    <button
                                        disabled={
                                            loadingReportId === report.id ||
                                            confirmedReports.has(report.id) ||
                                            (user ? (report.confirmedBy ?? []).includes(user.uid) : false)
                                        }
                                        onClick={() => handleConfirm(report)}
                                        className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${confirmedReports.has(report.id) ||
                                            (user && (report.confirmedBy ?? []).includes(user.uid))
                                            ? "bg-green-600 text-white cursor-not-allowed opacity-80"
                                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
                                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                                    >
                                        {loadingReportId === report.id ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Confirming...
                                            </>
                                        ) : confirmedReports.has(report.id) ||
                                            (user && (report.confirmedBy ?? []).includes(user.uid)) ? (
                                            <>
                                                <span>✓</span> You're Affected
                                            </>
                                        ) : (
                                            <>
                                                <span>📍</span> I'm Affected Too
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}