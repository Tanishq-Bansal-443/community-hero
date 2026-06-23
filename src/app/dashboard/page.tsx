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
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
} from "@/lib/cloudinary";
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

    repairImageUrl?: string;
    verificationConfidence?: number | null;
    verificationReason?: string;
    fraudRisk?: string;
    resolvedAt?: any;
};

export default function DashboardPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] =
        useState<[number, number] | null>(null);
    const [selectedReport, setSelectedReport] =
        useState<Report | null>(null);
    const [repairFile, setRepairFile] =
        useState<File | null>(null);
    const [uploadingRepair, setUploadingRepair] =
        useState(false);
    const [showRepairUpload, setShowRepairUpload] =
        useState(false);

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

    async function uploadRepairEvidence() {
        if (!repairFile || !selectedReport) return;

        setUploadingRepair(true);

        try {
            const formData = new FormData();

            formData.append("file", repairFile);
            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );

            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const uploadData =
                await uploadResponse.json();

            const verificationResponse =
                await fetch(
                    "/api/verify-repair",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            originalImageUrl:
                                selectedReport.imageUrl,

                            repairImageUrl:
                                uploadData.secure_url,
                        }),
                    }
                );

            const verificationData =
                await verificationResponse.json();

            if (!verificationData.success) {
                alert(
                    verificationData.error
                );

                return;
            }

            console.log(
                "VERIFICATION:",
                verificationData
            );

            const result =
                verificationData.analysis;

            await updateDoc(
                doc(
                    db,
                    "reports",
                    selectedReport.id
                ),
                {
                    repairImageUrl:
                        uploadData.secure_url,

                    status: result.resolved
                        ? "resolved"
                        : "disputed",

                    verificationConfidence:
                        result.confidence,

                    verificationReason:
                        result.reason,

                    fraudRisk:
                        result.fraudRisk,
                }
            );

            alert(
                result.resolved
                    ? "Issue verified and resolved"
                    : "Issue disputed by AI"
            );

            setShowRepairUpload(false);
            setSelectedReport(null);
            setRepairFile(null);
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingRepair(false);
        }
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

    const resolvedCount = reports.filter(
        (r) => r.status === "resolved"
    ).length;

    const disputedCount = reports.filter(
        (r) => r.status === "disputed"
    ).length;

    const resolutionRate =
        reports.length > 0
            ? Math.round(
                (resolvedCount /
                    reports.length) *
                100
            )
            : 0;

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
                        Resolved Issues
                    </h3>

                    <p className="text-3xl font-bold text-green-500">
                        {resolvedCount}
                    </p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                        Resolution Rate
                    </h3>

                    <p className="text-3xl font-bold text-blue-500">
                        {resolutionRate}%
                    </p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                        Disputed Reports
                    </h3>

                    <p className="text-3xl font-bold text-red-500">
                        {disputedCount}
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

                        {report.verificationConfidence && (
                            <div className="mt-2 text-sm">
                                <p>
                                    AI Confidence:{" "}
                                    {report.verificationConfidence}%
                                </p>

                                <p>
                                    Fraud Risk: {report.fraudRisk}
                                </p>
                            </div>
                        )}

                        <div className="mt-2">
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${report.status === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : report.status === "under_review"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : report.status === "repair_submitted"
                                            ? "bg-blue-100 text-blue-700"
                                            : report.status === "disputed"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {report.status}
                            </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                            {report.status !== "resolved" &&
                                report.status !== "disputed" && (
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
                                )}

                            {report.status !== "resolved" &&
                                report.status !== "disputed" && (
                                    <button
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setShowRepairUpload(true);
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded"
                                    >
                                        Submit Repair Evidence
                                    </button>
                                )}

                        </div>

                        <p className="mt-2">
                            {report.description}
                        </p>

                        {report.verificationReason && (
                            <div className="mt-3 p-3 rounded bg-gray-900 border border-gray-700">
                                <p className="text-xs uppercase text-gray-400">
                                    AI Verification
                                </p>

                                <p className="mt-1 text-sm">
                                    {report.verificationReason}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showRepairUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">
                            Upload Repair Evidence
                        </h2>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setRepairFile(
                                    e.target.files?.[0] || null
                                )
                            }
                        />

                        <button
                            onClick={uploadRepairEvidence}
                            disabled={uploadingRepair}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Upload
                        </button>
                    </div>
                </div>
            )}

        </main>
    );
}