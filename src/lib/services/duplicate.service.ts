import { getNearbyReports } from "./report.service";
import { calculateDistance } from "../utils/distance";

export async function findDuplicate(
    issueType: string,
    latitude: number,
    longitude: number
) {
    const reports = await getNearbyReports(issueType);

    console.log("Candidate reports:", reports.length);

    let closestReport = null;
    let shortestDistance = Infinity;

    for (const report of reports) {
        const distance = calculateDistance(
            latitude,
            longitude,
            report.latitude,
            report.longitude
        );

        console.log(
            "Distance to report:",
            report.id,
            distance.toFixed(2),
            "meters"
        );

        if (
            distance <= 100 &&
            distance < shortestDistance
        ) {
            shortestDistance = distance;
            closestReport = report;
        }
    }

    console.log("Closest report:", closestReport);

    return closestReport;
}