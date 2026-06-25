export interface Report {
    imageUrl: string;

    issueType: string;

    severity: "Low" | "Medium" | "High";

    description: string;

    latitude: number;

    longitude: number;

    status: "reported" | "under_review" | "resolved";

    repairImageUrl: string;

    verificationConfidence: number | null;

    verificationReason: string;

    fraudRisk: string;

    resolvedAt: Date | null;

    createdAt?: any;
}