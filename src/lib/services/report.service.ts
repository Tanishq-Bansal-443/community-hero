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

        supportingReports: arrayUnion({
            ...supportingReport,
            reportedAt: new Date(),
        }),
    });
}