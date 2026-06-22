"use client";

import { useState } from "react";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
} from "@/lib/cloudinary";

export default function ReportPage() {
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);

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

            // Upload to Cloudinary
            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const uploadData = await uploadResponse.json();

            console.log("CLOUDINARY:", uploadData);

            setImageUrl(uploadData.secure_url);

            // Send image URL to Gemini API
            const analysisResponse = await fetch("/api/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: uploadData.secure_url,
                }),
            });

            const analysisData =
                await analysisResponse.json();

            console.log(
                "ANALYSIS:",
                analysisData
            );
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
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
                <p className="mt-4">Uploading...</p>
            )}

            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="uploaded"
                    className="mt-6 max-w-md rounded-lg"
                />
            )}
        </main>
    );
}