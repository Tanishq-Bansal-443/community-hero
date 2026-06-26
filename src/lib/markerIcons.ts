import L from "leaflet";

const shadow =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png";

function createIcon(color: string) {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl: shadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
}

export const resolvedIcon = createIcon("green");

export const markerIcons = {
    Low: createIcon("green"),
    Medium: createIcon("yellow"),
    High: createIcon("orange"),
    Severe: createIcon("red"),
};