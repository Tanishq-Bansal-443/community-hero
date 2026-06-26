import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();

        const prompt = `
You are an AI civic issue detector.

Analyze the image carefully.

Determine whether the image shows a REAL public infrastructure problem.

VALID ISSUE TYPES (choose EXACTLY ONE):

- Pothole
- Garbage
- Broken Streetlight
- Water Logging
- Sewage Issue

You MUST return one of these five issue types EXACTLY.

Do NOT invent new issue types.

Examples:
❌ Damaged Road
❌ Road Damage
❌ Cracked Road
❌ Broken Asphalt

These MUST all become:

"Pothole"

Severity MUST be one of:

- Low
- Medium
- High
- Severe

Return ONLY valid JSON.

If it IS a community issue:

{
  "isCommunityIssue": true,
  "issueType": "Pothole",
  "severity": "High",
  "description": "..."
}

If NOT:

{
  "isCommunityIssue": false,
  "reason": "..."
}
`;

        const imageResponse = await fetch(imageUrl);

        const imageBuffer =
            Buffer.from(await imageResponse.arrayBuffer());

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBuffer.toString("base64"),
                },
            },
        ]);

        const text = result.response.text();

        const analysis = JSON.parse(
            text.replace(/```json|```/g, "").trim()
        );

        const VALID_TYPES = [
            "Pothole",
            "Garbage",
            "Broken Streetlight",
            "Water Logging",
            "Sewage Issue",
        ];

        if (analysis.isCommunityIssue) {
            const normalizedType = VALID_TYPES.find(
                (type) =>
                    type.toLowerCase() ===
                    analysis.issueType?.toLowerCase()
            );

            analysis.issueType =
                normalizedType ?? "Pothole";
        }

        const VALID_SEVERITY = [
            "Low",
            "Medium",
            "High",
            "Severe",
        ];

        if (analysis.isCommunityIssue) {
            const normalizedSeverity =
                VALID_SEVERITY.find(
                    (level) =>
                        level.toLowerCase() ===
                        analysis.severity?.toLowerCase()
                );

            analysis.severity =
                normalizedSeverity ?? "Medium";
        }

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error),
        });
    }
}