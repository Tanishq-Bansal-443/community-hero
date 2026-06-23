"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
} from "react-leaflet";
import { useState } from "react";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickMarker({
    position,
    onChange,
}: {
    position: [number, number];
    onChange: (
        position: [number, number]
    ) => void;
}) {
    useMapEvents({
        click(e) {
            onChange([
                e.latlng.lat,
                e.latlng.lng,
            ]);
        },
    });

    return <Marker position={position} />;
}

export default function LocationPicker({
    latitude,
    longitude,
    onLocationChange,
}: {
    latitude: number;
    longitude: number;
    onLocationChange: (
        lat: number,
        lng: number
    ) => void;
}) {
    const [position, setPosition] =
        useState<[number, number]>([
            latitude,
            longitude,
        ]);

    return (
        <MapContainer
            center={[latitude, longitude]}
            zoom={17}
            scrollWheelZoom={true}
            style={{
                height: "450px",
                width: "100%",
            }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ClickMarker
                position={position}
                onChange={(newPosition) => {
                    setPosition(newPosition);

                    onLocationChange(
                        newPosition[0],
                        newPosition[1]
                    );
                }}
            />
        </MapContainer>
    );
}