import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const {
            originalImageUrl,
            repairImageUrl,
        } = await req.json();

        const prompt = `
You are an AI Accountability Agent for civic infrastructure.

You will receive:

1. Original issue image
2. Repair evidence image

Determine whether the reported issue has genuinely been resolved.

Return ONLY valid JSON.

If the issue is resolved:

{
  "resolved": true,
  "confidence": 92,
  "fraudRisk": "low",
  "reason": "The pothole visible in the original image has been repaired and is no longer visible."
}

If the issue is NOT resolved:

{
  "resolved": false,
  "confidence": 35,
  "fraudRisk": "medium",
  "reason": "The issue still appears visible in the repair image."
}
`;

        const originalResponse = await fetch(
            originalImageUrl
        );

        const repairResponse = await fetch(
            repairImageUrl
        );

        const originalBuffer = Buffer.from(
            await originalResponse.arrayBuffer()
        );

        const repairBuffer = Buffer.from(
            await repairResponse.arrayBuffer()
        );

        const result =
            await model.generateContent([
                prompt,

                {
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: originalBuffer.toString(
                            "base64"
                        ),
                    },
                },

                {
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: repairBuffer.toString(
                            "base64"
                        ),
                    },
                },
            ]);

        const text = result.response.text();

        const analysis = JSON.parse(
            text.replace(
                /```json|```/g,
                ""
            ).trim()
        );

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error(
            "VERIFY REPAIR ERROR:",
            error
        );

        return NextResponse.json({
            success: false,
            error: String(error),
        });
    }
}