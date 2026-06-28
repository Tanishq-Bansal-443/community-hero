export interface Report {
    // User info
    userId: string;
    userEmail: string;

    // Image & issue details
    imageUrl: string;
    issueType: string;
    severity: "Low" | "Medium" | "High" | "Severe"; // ← Added "Severe"
    description: string;

    // Location
    latitude: number;
    longitude: number;

    // Status
    status: "reported" | "under_review" | "resolved" | "disputed";

    // Verification (optional)
    repairImageUrl?: string | null;
    verificationConfidence?: number | null;
    verificationReason?: string;
    fraudRisk?: string;

    // Community engagement
    communityReports: number;
    affectedCount: number;
    confirmedBy: string[];

    // Supporting reports (merged duplicates)
    supportingReports: {
        imageUrl: string;
        latitude: number;
        longitude: number;
        description: string;
        reportedAt?: any;
    }[];

    // Timestamps
    resolvedAt: Date | null;
    createdAt?: any;

    // Re-verification tracking (optional)
    previousRepairImageUrl?: string;
    previousVerificationConfidence?: number | null;
    previousVerificationReason?: string;
    previousFraudRisk?: string;
    verificationAttempts?: number;
}