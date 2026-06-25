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

    // Number of citizens reporting the same issue
    communityReports: number;

    // Other citizen reports merged into this issue
    supportingReports: {
        imageUrl: string;
        latitude: number;
        longitude: number;
        description: string;
        reportedAt?: any;
    }[];

    resolvedAt: Date | null;

    createdAt?: any;
}