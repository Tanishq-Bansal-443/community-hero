"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
} from "@/lib/cloudinary";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
const LocationPicker = dynamic(
    () => import("@/components/LocationPicker"),
    {
        ssr: false,
    }
);

export default function ReportPage() {
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
        }
    }, [loading, user, router]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.error(error);
            }
        );
    }, []);

    async function handleUpload(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = e.target.files?.[0];

        if (!file) return;

        setUploading(true);

        try {
            const formData = new FormData();

            formData.append("file", file);
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

            setImageUrl(uploadData.secure_url);

            const analysisResponse = await fetch(
                "/api/analyze",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        imageUrl:
                            uploadData.secure_url,
                    }),
                }
            );

            const analysisData =
                await analysisResponse.json();

            console.log(
                "ANALYSIS:",
                analysisData
            );

            if (!analysisData.success) {
                alert(
                    "AI service is temporarily busy. Please try again."
                );
                return;
            }

            if (
                !analysisData.analysis
                    .isCommunityIssue
            ) {
                alert(
                    analysisData.analysis.reason
                );
                return;
            }

            setAnalysis({
                ...analysisData.analysis,
                imageUrl:
                    uploadData.secure_url,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    }

    console.log("Frontend location:", location);

    async function submitReport() {
        if (!analysis || !location) return;

        console.log("Submitting location:", location);

        const response = await fetch("/api/report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: user!.uid,
                userEmail: user!.email,

                imageUrl: analysis.imageUrl,
                issueType: analysis.issueType,
                severity: analysis.severity,
                description: analysis.description,
                latitude: location.latitude,
                longitude: location.longitude,
                status: "reported",
                repairImageUrl: "",
                verificationConfidence: null,
                verificationReason: "",
                fraudRisk: "",
                resolvedAt: null,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            alert("Failed to submit report.");
            return;
        }

        alert(
            "Report submitted successfully!"
        );

        setAnalysis(null);
        setImageUrl("");
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl font-semibold">
                    Checking authentication...
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-4xl font-bold">
                Report Community Issue
            </h1>

            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="mt-6"
            />

            {uploading && (
                <p className="mt-4">
                    Uploading...
                </p>
            )}

            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="uploaded"
                    className="mt-6 max-w-md rounded-lg"
                />
            )}

            {analysis && location && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">
                        Select Exact Issue
                        Location
                    </h2>

                    <LocationPicker
                        latitude={
                            location.latitude
                        }
                        longitude={
                            location.longitude
                        }
                        onLocationChange={(
                            lat,
                            lng
                        ) => {
                            setLocation({
                                latitude: lat,
                                longitude: lng,
                            });
                        }}
                    />

                    <button
                        onClick={
                            submitReport
                        }
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
                    >
                        Submit Report
                    </button>
                </div>
            )}
        </main>
    );
}