"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const redIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

type Report = {
    id: string;
    issueType: string;
    severity: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    description: string;
};

export default function IssueMap({
    reports,
    center,
}: {
    reports: Report[];
    center: [number, number];
}) {
    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{
                height: "600px",
                width: "100%",
            }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((report) => (
                <Marker
                    key={report.id}
                    icon={redIcon}
                    position={[
                        report.latitude,
                        report.longitude,
                    ]}
                >
                    <Popup>
                        <img
                            src={report.imageUrl}
                            className="w-40 rounded mb-2"
                        />

                        <strong>{report.issueType}</strong>

                        <br />

                        Severity: {report.severity}

                        <br />

                        {report.description}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}