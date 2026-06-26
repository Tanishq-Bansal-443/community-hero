"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    orderBy,
    query,
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
    status: string;
    affectedCount: number;
    confirmedBy: string[];
    communityReports: number;
    verificationConfidence?: number | null;
    verificationReason?: string;
    repairImageUrl?: string;
    createdAt?: any;
};

export default function CitizenDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const [center, setCenter] = useState<
        [number, number]
    >([30.901, 75.8573]);

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

        async function loadReports() {
            const q = query(
                collection(db, "reports"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(
                (doc) =>
                    ({
                        id: doc.id,
                        ...doc.data(),
                    }) as Report
            );

            setReports(data);
            setLoading(false);
        }

        loadReports();
    }, []);

    const activeReports = useMemo(
        () =>
            reports.filter(
                (r) => r.status !== "resolved"
            ),
        [reports]
    );

    const resolvedReports = useMemo(
        () =>
            reports.filter(
                (r) => r.status === "resolved"
            ),
        [reports]
    );

    const totalCommunityReports = useMemo(
        () =>
            reports.reduce(
                (sum, report) =>
                    sum +
                    (report.communityReports ?? 1),
                0
            ),
        [reports]
    );

    const resolutionRate = useMemo(() => {
        if (!reports.length) return 0;

        return Math.round(
            (resolvedReports.length /
                reports.length) *
            100
        );
    }, [reports, resolvedReports]);

    function statusColor(status: string) {
        switch (status) {
            case "resolved":
                return "bg-green-100 text-green-700";

            case "under_review":
                return "bg-yellow-100 text-yellow-700";

            default:
                return "bg-red-100 text-red-700";
        }
    }

    // Helper function to format status text
    function formatStatus(status: string): string {
        return status
            .replace("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Helper function to get severity color
    function getSeverityColor(severity: string): string {
        switch (severity) {
            case "Severe":
                return "text-red-600";
            case "High":
                return "text-orange-500";
            case "Medium":
                return "text-yellow-600";
            case "Low":
                return "text-green-600";
            default:
                return "text-slate-700";
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white">
                <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col lg:flex-row justify-between items-center gap-10">

                    <div className="max-w-2xl">

                        <p className="uppercase tracking-[0.3em] text-cyan-200 font-semibold">
                            COMMUNITY HERO
                        </p>

                        <h1 className="text-5xl font-bold mt-4 leading-tight">
                            AI Powered Civic
                            Transparency Platform
                        </h1>

                        <p className="mt-6 text-lg text-blue-100 leading-8">
                            Report issues, follow
                            their progress, and
                            watch your community
                            become better with
                            AI-assisted civic
                            accountability.
                        </p>

                        <div className="mt-10 flex gap-4">

                            <Link
                                href="/report"
                                className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
                            >
                                Report an Issue
                            </Link>

                            <Link
                                href="/authority"
                                className="border border-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
                            >
                                Authority Portal
                            </Link>

                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 w-full max-w-md">

                        <div className="bg-white rounded-2xl p-6 text-slate-900 shadow">

                            <p className="text-sm text-slate-500">
                                Active Issues
                            </p>

                            <h2 className="text-4xl font-bold mt-2">
                                {
                                    activeReports.length
                                }
                            </h2>

                        </div>

                        <div className="bg-white rounded-2xl p-6 text-slate-900 shadow">

                            <p className="text-sm text-slate-500">
                                Resolved
                            </p>

                            <h2 className="text-4xl font-bold mt-2">
                                {
                                    resolvedReports.length
                                }
                            </h2>

                        </div>

                        <div className="bg-white rounded-2xl p-6 text-slate-900 shadow">

                            <p className="text-sm text-slate-500">
                                Community Reports
                            </p>

                            <h2 className="text-4xl font-bold mt-2">
                                {
                                    totalCommunityReports
                                }
                            </h2>

                        </div>

                        <div className="bg-white rounded-2xl p-6 text-slate-900 shadow">

                            <p className="text-sm text-slate-500">
                                Resolution Rate
                            </p>

                            <h2 className="text-4xl font-bold mt-2">
                                {resolutionRate}%
                            </h2>

                        </div>

                    </div>

                </div>
            </section>

            <section className="max-w-7xl mx-auto px-8 py-12">

                <div className="flex items-center justify-between mb-6">

                    <div>

                        <h2 className="text-3xl font-bold">
                            Live Community Map
                        </h2>

                        <p className="text-slate-500 mt-2">
                            Explore ongoing civic
                            issues around your
                            location in real time.
                        </p>

                    </div>

                </div>

                <div className="rounded-3xl overflow-hidden shadow-lg border bg-white">

                    <IssueMap
                        reports={activeReports}
                        center={center}
                    />

                </div>

            </section>

            <section className="max-w-7xl mx-auto px-8 pb-14">

                <div className="flex items-center justify-between mb-8">

                    <div>

                        <h2 className="text-3xl font-bold">
                            Active Issues Near You
                        </h2>

                        <p className="text-slate-500 mt-2">
                            Stay informed about ongoing civic issues
                            reported by your community.
                        </p>

                    </div>

                    <span className="text-sm font-medium bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                        {activeReports.length} Active
                    </span>

                </div>

                {loading ? (

                    <div className="text-center py-16 text-slate-500">
                        Loading reports...
                    </div>

                ) : activeReports.length === 0 ? (

                    <div className="bg-white rounded-3xl shadow p-10 text-center">

                        <h3 className="text-2xl font-semibold">
                            No Active Reports
                        </h3>

                        <p className="text-slate-500 mt-3">
                            Your community currently has no active
                            civic issues nearby.
                        </p>

                    </div>

                ) : (

                    <div className="grid lg:grid-cols-2 gap-8">

                        {activeReports.map((report) => (

                            <div
                                key={report.id}
                                className="bg-white rounded-3xl shadow hover:shadow-xl transition overflow-hidden border"
                            >

                                <img
                                    src={report.imageUrl}
                                    alt={report.issueType}
                                    className="w-full h-64 object-cover"
                                />

                                <div className="p-6">

                                    <div className="flex justify-between items-start gap-4">

                                        <div>

                                            <h3 className="text-2xl font-bold">
                                                {report.issueType}
                                            </h3>

                                            <p className="text-slate-500 mt-1">
                                                {report.description}
                                            </p>

                                        </div>

                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(
                                                report.status
                                            )}`}
                                        >
                                            {formatStatus(report.status)}
                                        </span>

                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6">

                                        <div className="bg-slate-50 rounded-xl p-4">

                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Severity
                                            </p>

                                            <p
                                                className={`font-bold text-lg mt-1 ${getSeverityColor(
                                                    report.severity
                                                )}`}
                                            >
                                                {report.severity}
                                            </p>

                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4">

                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Community Reports
                                            </p>

                                            <p className="font-bold text-lg mt-1">
                                                👥{" "}
                                                {report.communityReports ??
                                                    1}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>

            <section className="max-w-7xl mx-auto px-8 pb-20">

                <div className="flex items-center justify-between mb-8">

                    <div>

                        <h2 className="text-3xl font-bold">
                            Recently Resolved
                        </h2>

                        <p className="text-slate-500 mt-2">
                            AI verified repairs completed by
                            local authorities.
                        </p>

                    </div>

                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                        {resolvedReports.length} Resolved
                    </span>

                </div>

                {resolvedReports.length === 0 ? (

                    <div className="bg-white rounded-3xl shadow p-10 text-center">

                        <h3 className="text-2xl font-semibold">
                            No Resolved Issues Yet
                        </h3>

                        <p className="text-slate-500 mt-3">
                            Resolved reports will appear here after
                            AI verification.
                        </p>

                    </div>

                ) : (

                    <div className="grid lg:grid-cols-2 gap-8">

                        {resolvedReports.map((report) => (

                            <div
                                key={report.id}
                                className="bg-white rounded-3xl shadow overflow-hidden border"
                            >

                                <img
                                    src={
                                        report.repairImageUrl ||
                                        report.imageUrl
                                    }
                                    alt={report.issueType}
                                    className="w-full h-64 object-cover"
                                />

                                <div className="p-6">

                                    <div className="flex justify-between items-start">

                                        <div>

                                            <h3 className="text-2xl font-bold">
                                                {report.issueType}
                                            </h3>

                                            <p className="text-slate-500 mt-1">
                                                {report.description}
                                            </p>

                                        </div>

                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            RESOLVED
                                        </span>

                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6">

                                        <div className="bg-green-50 rounded-xl p-4">

                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                AI Verification
                                            </p>

                                            <p className="font-bold text-lg mt-1">
                                                {report.verificationConfidence ??
                                                    100}
                                                %
                                            </p>

                                        </div>

                                        <div className="bg-blue-50 rounded-xl p-4">

                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Community Reports
                                            </p>

                                            <p className="font-bold text-lg mt-1">
                                                👥{" "}
                                                {report.communityReports ??
                                                    1}
                                            </p>

                                        </div>

                                    </div>

                                    {report.verificationReason && (

                                        <div className="mt-5 bg-slate-50 rounded-xl p-4">

                                            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                                                AI Reasoning
                                            </p>

                                            <p className="text-slate-700">
                                                {
                                                    report.verificationReason
                                                }
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>

            <footer className="border-t bg-white">

                <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row justify-between items-center gap-6">

                    <div>

                        <h3 className="font-bold text-xl">
                            Community Hero
                        </h3>

                        <p className="text-slate-500 mt-2">
                            Building safer communities with
                            AI-powered civic transparency.
                        </p>

                    </div>

                    <div className="flex gap-4">

                        <Link
                            href="/report"
                            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                        >
                            Report Issue
                        </Link>

                        <Link
                            href="/authority"
                            className="border border-slate-300 px-5 py-3 rounded-xl font-semibold hover:bg-slate-100 transition"
                        >
                            Authority Dashboard
                        </Link>

                    </div>

                </div>

            </footer>

        </main>
    );
}