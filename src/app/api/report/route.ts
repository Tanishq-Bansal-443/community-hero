import { NextRequest, NextResponse } from "next/server";
import { createReport } from "@/lib/services/report.service";

export async function POST(req: NextRequest) {
    try {
        const report = await req.json();

        await createReport(report);

        return NextResponse.json({
            success: true,
            message: "Report created successfully",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to create report",
            },
            { status: 500 }
        );
    }
}