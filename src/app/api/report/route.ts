import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();

        const prompt = `
You are a civic issue detector.

Look at the image and return ONLY JSON.

{
  "issueType": "",
  "severity": "",
  "description": ""
}

Possible issue types:
- pothole
- garbage
- broken_streetlight
- water_logging
- damaged_road
- other
`;

        const result = await model.generateContent([
            prompt,
            imageUrl,
        ]);

        const text = result.response.text();

        return NextResponse.json({
            success: true,
            analysis: text,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error),
        });
    }
}