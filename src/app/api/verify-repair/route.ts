import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Verifies a repair by comparing original and repair images using Gemini.
 * OPTIMIZED FOR DEMO: Detailed fraud detection and varied verification outcomes.
 * 
 * @param req - Expects { reportId, originalImageUrl, repairImageUrl }
 * @returns Verification result with confidence, fraud risk, and detailed reasoning
 */
export async function POST(req: Request) {
    try {
        const { reportId, originalImageUrl, repairImageUrl } = await req.json();

        console.log("[Verify] === STARTING VERIFICATION ===");
        console.log("[Verify] Report ID:", reportId);

        // Validate input
        if (!reportId || !originalImageUrl || !repairImageUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: reportId, originalImageUrl, repairImageUrl"
                },
                { status: 400 }
            );
        }

        // 1. Fetch existing report
        const reportRef = doc(db, "reports", reportId);
        const reportSnap = await getDoc(reportRef);

        if (!reportSnap.exists()) {
            return NextResponse.json(
                { success: false, error: "Report not found" },
                { status: 404 }
            );
        }

        const reportData = reportSnap.data();

        // 2. Idempotency check - BUT allow re-verification if DISPUTED
        // If already verified AND status is NOT disputed, return cached result
        if (
            reportData.repairImageUrl &&
            reportData.verificationConfidence !== null &&
            reportData.status !== "disputed"
        ) {
            console.log("[Verify] Report already verified (non-disputed), returning cached result");
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                analysis: {
                    resolved: reportData.status === "resolved",
                    confidence: reportData.verificationConfidence,
                    fraudRisk: reportData.fraudRisk,
                    reason: reportData.verificationReason,
                },
                message: "Report already verified",
            });
        }

        // If disputed and new evidence is uploaded, we proceed with re-verification
        if (reportData.status === "disputed" && reportData.repairImageUrl) {
            console.log("[Verify] Report was disputed. Re-verifying with new evidence...");
            // Store old evidence for reference (optional)
            await updateDoc(reportRef, {
                previousRepairImageUrl: reportData.repairImageUrl,
                previousVerificationConfidence: reportData.verificationConfidence,
                previousVerificationReason: reportData.verificationReason,
                previousFraudRisk: reportData.fraudRisk,
            });
        }

        // 3. ENHANCED VERIFICATION PROMPT with fraud detection
        const prompt = `
You are a Senior Civic Infrastructure Auditor AI for a smart city initiative.

**YOUR TASK:** Compare the "before" (original issue) and "after" (repair evidence) images to determine:
1. Has the issue been genuinely resolved?
2. Is there any evidence of fraud or misconduct?
3. How confident are you in your assessment?

---

**RESOLUTION ASSESSMENT CRITERIA:**

✅ **RESOLVED** - The issue is completely fixed
- The pothole is filled and surface is smooth
- Garbage is completely removed and area is clean
- Streetlight is functioning (visible light or new fixture)
- Water has drained completely and road is dry
- Sewage is cleaned up with no visible waste or smell

🟡 **PARTIALLY RESOLVED** - Some improvement but not fully fixed
- Pothole is patched but still visible/uneven
- Most garbage removed but some remains
- Light is working but dimmer than it should be
- Water level reduced but still present
- Some sewage cleaned but residue remains

❌ **NOT RESOLVED** - Issue remains or worsened
- The problem looks exactly the same or worse
- New damage appears in the repair image
- The repair image shows a DIFFERENT location
- The repair image is too blurry/zoomed to verify

---

**FRAUD DETECTION CRITERIA:**

🚨 **HIGH FRAUD RISK** - Obvious misconduct
- Image is clearly photoshopped or manipulated
- Completely different location (different road, buildings, etc.)
- Repair image is of a different issue type entirely
- The "repair" seems staged

⚠️ **MEDIUM FRAUD RISK** - Suspicious but not conclusive
- Poor quality repair that might be intentional
- Partial repair that doesn't address root cause
- Image angles make comparison difficult

🟢 **LOW FRAUD RISK** - Genuine, good-faith repair
- Professional repair work visible
- Proper materials used
- Same location confirmed by landmarks
- Clear, clean images showing the full repair

---

**CONFIDENCE SCORING:**
- 90-100%: Clear, unambiguous resolution/fraud
- 70-89%: Strong evidence for one outcome
- 50-69%: Moderate evidence, some ambiguity
- Below 50%: Low confidence, cannot reliably determine

---

**OUTPUT FORMAT (Return ONLY valid JSON):**

{
  "resolved": true,
  "confidence": 94,
  "fraudRisk": "low",
  "reason": "The tire-sized pothole has been properly filled with fresh asphalt. The surrounding road texture matches the repair area, and landmarks confirm the same intersection."
}

{
  "resolved": false,
  "confidence": 42,
  "fraudRisk": "medium",
  "reason": "The repair image shows the same location, but the pothole has only been partially filled with gravel. This looks like a temporary fix that will fail quickly."
}
`;

        // 4. Fetch both images
        console.log("[Verify] Fetching images...");
        const [origResp, repairResp] = await Promise.all([
            fetch(originalImageUrl),
            fetch(repairImageUrl),
        ]);

        if (!origResp.ok || !repairResp.ok) {
            return NextResponse.json(
                { success: false, error: "Failed to fetch one or both images" },
                { status: 400 }
            );
        }

        const origBuffer = Buffer.from(await origResp.arrayBuffer());
        const repairBuffer = Buffer.from(await repairResp.arrayBuffer());
        const origBase64 = origBuffer.toString("base64");
        const repairBase64 = repairBuffer.toString("base64");

        // 5. Call Gemini with both images
        console.log(`[Verify] Starting verification for report ${reportId}`);
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: origBase64
                }
            },
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: repairBase64
                }
            },
        ]);

        const text = result.response.text();
        const cleanText = text.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanText);

        // 6. Determine final outcome with smart thresholds
        const confidence = analysis.confidence || 0;
        let resolved = analysis.resolved === true;
        let fraudRisk = analysis.fraudRisk || "medium";
        let finalStatus: "resolved" | "disputed" = "disputed";

        if (confidence < 40) {
            finalStatus = "disputed";
            resolved = false;
        } else if (confidence >= 70 && resolved) {
            finalStatus = "resolved";
        } else if (confidence >= 50 && resolved && fraudRisk === "low") {
            finalStatus = "resolved";
        } else {
            finalStatus = "disputed";
            resolved = false;
        }

        console.log(`[Verify] Report ${reportId} -> ${finalStatus} (confidence: ${confidence}%, fraud: ${fraudRisk})`);

        // 7. Update Firestore
        const updateData: any = {
            repairImageUrl,
            verificationConfidence: confidence,
            verificationReason: analysis.reason || "No reason provided by AI",
            fraudRisk: fraudRisk,
            status: finalStatus,
            resolvedAt: finalStatus === "resolved" ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
            verificationAttempts: (reportData.verificationAttempts || 0) + 1,
        };

        await updateDoc(reportRef, updateData);

        // 8. Return result
        return NextResponse.json({
            success: true,
            alreadyVerified: false,
            isReVerification: reportData.status === "disputed",
            analysis: {
                resolved,
                confidence,
                fraudRisk,
                reason: analysis.reason || "No reason provided by AI",
                finalStatus,
            },
            message: finalStatus === "resolved"
                ? "✅ Issue verified and marked as Resolved!"
                : "⚠️ AI could not verify this repair. Please upload clearer evidence.",
        });

    } catch (error) {
        console.error("[Verify] Error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}