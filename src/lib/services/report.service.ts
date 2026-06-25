import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "firebase/firestore";

import type { Report } from "@/lib/types/report";

export async function createReport(report: Report) {
    return await addDoc(collection(db, "reports"), {
        ...report,
        createdAt: serverTimestamp(),
    });
}