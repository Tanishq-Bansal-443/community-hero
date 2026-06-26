"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcons, resolvedIcon } from "@/lib/markerIcons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { confirmIssue } from "@/lib/services/report.service";

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

    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{ height: "450px", width: "100%" }}
            className="rounded-3xl"
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
                    <Popup maxWidth={320} minWidth={280} className="custom-popup" autoPan>
                        <div className="relative">
                            <img
                                src={report.imageUrl}
                                alt={report.issueType}
                                className="w-full h-44 object-cover rounded-t-xl"
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

                            {report.status === "resolved" &&
                                report.verificationConfidence && (
                                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-lg">
                                        🤖 AI Verified {report.verificationConfidence}%
                                    </span>
                                )}
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">
                                    {report.issueType}
                                </h3>

                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${report.severity === "Severe"
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

                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                                {report.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <p className="text-xs text-slate-500">Evidence Submitted</p>
                                    <p className="font-bold text-slate-900">
                                        📸 {report.communityReports}
                                    </p>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <p className="text-xs text-slate-500">Citizens Affected</p>
                                    <p className="font-bold text-slate-900">
                                        👥 {localCounts[report.id] ?? report.affectedCount}
                                    </p>
                                </div>
                            </div>

                            {report.status === "resolved" && (
                                <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                                    <span>✅</span>
                                    <span className="text-xs font-medium text-emerald-700">
                                        AI Verified Repair
                                        {report.verificationConfidence
                                            ? ` (${report.verificationConfidence}% confidence)`
                                            : ""}
                                    </span>
                                </div>
                            )}

                            {report.status === "disputed" && (
                                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                    <span>⚠️</span>
                                    <span className="text-xs font-medium text-red-700">
                                        AI Disputed - Needs Review
                                    </span>
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-200">
                                <button
                                    disabled={
                                        loadingReportId === report.id ||
                                        confirmedReports.has(report.id) ||
                                        (user
                                            ? (report.confirmedBy ?? []).includes(user.uid)
                                            : false)
                                    }
                                    onClick={() => handleConfirm(report)}
                                    className={`w-full py-2.5 rounded-lg font-semibold transition ${confirmedReports.has(report.id) ||
                                            (user &&
                                                (report.confirmedBy ?? []).includes(user.uid))
                                            ? "bg-green-600 text-white cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                >
                                    {loadingReportId === report.id
                                        ? "Confirming..."
                                        : confirmedReports.has(report.id) ||
                                            (user &&
                                                (report.confirmedBy ?? []).includes(user.uid))
                                            ? "✓ You're Affected"
                                            : "📍 I'm Affected Too"}
                                </button>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
