import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();

        const prompt = `
You are an AI civic issue detector.

Analyze the image.

First determine whether it represents a real community or public infrastructure issue.

Examples of VALID issues:
- pothole
- garbage accumulation
- broken streetlight
- water logging
- damaged road
- sewage issue
- public infrastructure damage

Examples of INVALID images:
- selfies
- anime
- pets
- food
- landscapes
- memes
- screenshots
- random objects
- people posing

Return ONLY valid JSON.

If it IS a community issue:

{
  "isCommunityIssue": true,
  "issueType": "",
  "severity": "",
  "description": ""
}

If it is NOT a community issue:

{
  "isCommunityIssue": false,
  "reason": ""
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