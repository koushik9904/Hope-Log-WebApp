import React, { useRef } from "react";
import { FaceAngrySVG, FaceSadSVG, FaceSmileSVG } from "../assets/assets";
import { MapContainer, TileLayer , Marker , Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface JournalEntry {
    lat: number;
    lng: number;
    emotion: 'joy' | 'depressed' | 'angry';
    message: string;
}

const mockJournalData: JournalEntry[] = [
    { lat: 51.505, lng: -0.09, emotion: "joy", message: "Feeling great today!" },
    { lat: 40.7128, lng: -74.006, emotion: "depressed", message: "Feeling down..." },
    { lat: 35.6895, lng: 139.6917, emotion: "angry", message: "Had a rough day!" },
    { lat: 48.8566, lng: 2.3522, emotion: "joy", message: "Loving Paris!" },
    { lat: 34.0522, lng: -118.2437, emotion: "depressed", message: "Missing home..." },
    { lat: 55.7558, lng: 37.6173, emotion: "angry", message: "Traffic is terrible!" },
    { lat: 52.5200, lng: 13.4050, emotion: "joy", message: "Berlin is amazing!" },
    { lat: 37.7749, lng: -122.4194, emotion: "depressed", message: "Feeling lonely..." },
    { lat: 31.2304, lng: 121.4737, emotion: "angry", message: "Work stress!" },
    { lat: 28.6139, lng: 77.2090, emotion: "joy", message: "Enjoying the culture!" },
    { lat: -33.8688, lng: 151.2093, emotion: "depressed", message: "Feeling homesick..." },
    { lat: 35.6762, lng: 139.6503, emotion: "angry", message: "Long day at work!" },
    { lat: 19.0760, lng: 72.8777, emotion: "joy", message: "Loving the food!" },
    { lat: 51.1657, lng: 10.4515, emotion: "depressed", message: "Missing family..." },
    { lat: 41.9028, lng: 12.4964, emotion: "angry", message: "Frustrated with traffic!" },
    { lat: 40.4168, lng: -3.7038, emotion: "joy", message: "Madrid is beautiful!" },
    { lat: 39.9042, lng: 116.4074, emotion: "depressed", message: "Feeling isolated..." },
    { lat: 34.6937, lng: 135.5023, emotion: "angry", message: "Busy day!" },
    { lat: 55.9533, lng: -3.1883, emotion: "joy", message: "Edinburgh is stunning!" },
    { lat: 45.4642, lng: 9.1900, emotion: "depressed", message: "Feeling blue..." },
    { lat: 50.1109, lng: 8.6821, emotion: "angry", message: "Annoyed with work!" },
];



const WorldMap = () => {
    const mapRef = useRef(null);
    const latitude = 51.505;
    const longitude = -0.09;

    const getEmotionIcon = (emotion: 'joy' | 'depressed' | 'angry') => {
        const iconOptions = {
            joy: FaceSmileSVG.src,
            depressed: FaceSadSVG.src,
            angry: FaceAngrySVG.src,
        };

        return L.icon({
            iconUrl: iconOptions[emotion] || FaceSmileSVG.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41],
        });
    };

    if (typeof window === "undefined") {
        return null; // Render nothing during SSR
    }

    return (
        <div className="flex justify-center items-center mt-3">
            <MapContainer center={[latitude, longitude]} zoom={2} className="h-[80vh] w-[80vw]" ref={mapRef}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mockJournalData
                    .map((entry, index) => (
                        <Marker
                            key={index}
                            position={[entry.lat, entry.lng]}
                            icon={getEmotionIcon(entry.emotion)}
                        >
                            <Popup>{entry.message}</Popup>
                        </Marker>
                    ))}
            </MapContainer>
        </div>
    );
};

export default WorldMap;
