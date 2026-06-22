import { model } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();

        const prompt = `
Analyze this community issue image.

Return:
1. Issue Type
2. Severity (Low/Medium/High)
3. Short Description

Keep response under 100 words.
`;

        const result = await model.generateContent([
            prompt,
            imageUrl,
        ]);

        return Response.json({
            success: true,
            analysis: result.response.text(),
        });
    } catch (error) {
        console.error(error);

        return Response.json({
            success: false,
            error: String(error),
        });
    }
}