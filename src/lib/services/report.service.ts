import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
    doc,
    updateDoc,
    increment,
    arrayUnion,
    runTransaction,
    getDoc, // added for verification
} from "firebase/firestore";
import type { Report } from "@/lib/types/report";

/**
 * Creates a new report document in Firestore.
 * Initializes counters and timestamps.
 */
export async function createReport(report: Report) {
    console.log(`[ReportService] Creating report at (${report.latitude}, ${report.longitude})`);
    return await addDoc(collection(db, "reports"), {
        ...report,
        affectedCount: 1,
        confirmedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Fetches all non-resolved reports of a given issue type.
 * Used for duplicate detection.
 */
export async function getNearbyReports(
    issueType: string
): Promise<(Report & { id: string })[]> {
    const q = query(
        collection(db, "reports"),
        where("issueType", "==", issueType),
        where("status", "!=", "resolved")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Report),
    }));
}

/**
 * Merges a new report into an existing one.
 * Increments communityReports, affectedCount, adds the user to confirmedBy,
 * and appends supporting evidence.
 */
export async function mergeDuplicateReport(
    reportId: string,
    userId: string,
    supportingReport: {
        imageUrl: string;
        latitude: number;
        longitude: number;
        description: string;
    }
) {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
        communityReports: increment(1),
        affectedCount: increment(1),
        confirmedBy: arrayUnion(userId),
        supportingReports: arrayUnion({
            ...supportingReport,
            reportedAt: new Date(),
        }),
        updatedAt: serverTimestamp(),
    });
    console.log(`[ReportService] Merged report from user ${userId} into ${reportId}`);
}

/**
 * Allows a user to confirm an existing issue (vote).
 * Uses a transaction to prevent double-counting.
 */
export async function confirmIssue(reportId: string, userId: string) {
    const reportRef = doc(db, "reports", reportId);
    return await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reportRef);
        if (!snapshot.exists()) {
            throw new Error("Report not found");
        }
        const data = snapshot.data();
        const confirmedBy = (data.confirmedBy as string[]) ?? [];
        if (confirmedBy.includes(userId)) {
            return false; // Already confirmed
        }
        transaction.update(reportRef, {
            affectedCount: increment(1),
            confirmedBy: arrayUnion(userId),
            updatedAt: serverTimestamp(),
        });
        return true;
    });
}

/**
 * Updates verification results on a report.
 * Called from verify-repair route.
 */
export async function updateVerificationResult(
    reportId: string,
    data: {
        repairImageUrl: string;
        verificationConfidence: number;
        verificationReason: string;
        fraudRisk: string;
        status: "resolved" | "disputed";
        resolvedAt?: Date | null;
    }
) {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}