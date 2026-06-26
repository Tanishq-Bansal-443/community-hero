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
    arrayRemove,
} from "firebase/firestore";

import type { Report } from "@/lib/types/report";

export async function createReport(report: Report) {
    console.log(
        "Saving:",
        report.latitude,
        report.longitude
    );
    return await addDoc(collection(db, "reports"), {
        ...report,
        affectedCount: 1,
        confirmedBy: [],
        createdAt: serverTimestamp(),
    });
}

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
    });
}

export async function confirmIssue(
    reportId: string,
    userId: string
) {
    const reportRef = doc(db, "reports", reportId);

    return await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reportRef);

        if (!snapshot.exists()) {
            throw new Error("Report not found");
        }

        const data = snapshot.data();

        const confirmedBy =
            (data.confirmedBy as string[]) ?? [];

        if (confirmedBy.includes(userId)) {
            return false;
        }

        transaction.update(reportRef, {
            affectedCount: increment(1),
            confirmedBy: arrayUnion(userId),
        });

        return true;
    });
}