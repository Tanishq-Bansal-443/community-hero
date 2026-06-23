"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    orderBy,
    query,
    doc,
    updateDoc,
} from "firebase/firestore";
import dynamic from "next/dynamic";

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
    status: string;
    latitude: number;
    longitude: number;
};

export default function DashboardPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] =
        useState<[number, number] | null>(null);

    async function updateStatus(
        id: string,
        status: string
    ) {
        await updateDoc(
            doc(db, "reports", id),
            {
                status,
            }
        );

        setReports((prev) =>
            prev.map((report) =>
                report.id === id
                    ? { ...report, status }
                    : report
            )
        );
    }

    useEffect(() => {

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([
                    position.coords.latitude,
                    position.coords.longitude,
                ]);
            },
            (error) => {
                console.error(error);
            }
        );

        async function fetchReports() {
            const q = query(
                collection(db, "reports"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Report[];

            setReports(data);
            setLoading(false);
        }

        fetchReports();
    }, []);

    const highCount = reports.filter(
        (r) =>
            r.severity?.toLowerCase() === "high" ||
            r.severity?.toLowerCase() === "severe"
    ).length;

    const mediumCount = reports.filter(
        (r) =>
            r.severity?.toLowerCase() === "medium"
    ).length;

    const lowCount = reports.filter(
        (r) =>
            r.severity?.toLowerCase() === "low"
    ).length;

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-4xl font-bold mb-8">
                Community Reports
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                        Total Reports
                    </h3>

                    <p className="text-3xl font-bold">
                        {reports.length}
                    </p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                        High Severity
                    </h3>

                    <p className="text-3xl font-bold text-red-500">
                        {highCount}
                    </p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                        Medium Severity
                    </h3>

                    <p className="text-3xl font-bold text-yellow-500">
                        {mediumCount}
                    </p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                        Low Severity
                    </h3>

                    <p className="text-3xl font-bold text-green-500">
                        {lowCount}
                    </p>
                </div>
            </div>

            <div className="mb-8">
                <IssueMap
                    reports={reports.filter(
                        (report) =>
                            report.latitude &&
                            report.longitude
                    )}
                    center={
                        userLocation ?? [
                            30.900965,
                            75.857277,
                        ]
                    }
                />
            </div>

            {loading && <p>Loading...</p>}

            <div className="grid gap-6">
                {reports.map((report) => (
                    <div
                        key={report.id}
                        className="border rounded-lg p-4"
                    >
                        <img
                            src={report.imageUrl}
                            alt={report.issueType}
                            className="w-full max-w-md rounded-lg"
                        />

                        <h2 className="text-2xl font-semibold mt-4">
                            {report.issueType}
                        </h2>

                        <p>
                            Severity: {report.severity}
                        </p>

                        <div className="mt-2">
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${report.status === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : report.status ===
                                        "under_review"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {report.status}
                            </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() =>
                                    updateStatus(
                                        report.id,
                                        "under_review"
                                    )
                                }
                                className="px-3 py-1 bg-yellow-500 text-white rounded"
                            >
                                Review
                            </button>

                            <button
                                onClick={() =>
                                    updateStatus(
                                        report.id,
                                        "resolved"
                                    )
                                }
                                className="px-3 py-1 bg-green-600 text-white rounded"
                            >
                                Resolve
                            </button>
                        </div>

                        <p className="mt-2">
                            {report.description}
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}