import React, { useRef, useMemo } from "react";
import { FaceAngrySVG, FaceSadSVG, FaceSmileSVG } from "../assets/assets";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useWorldMap } from "../hooks/useWorldMap";
import {DailyAnnoymousUserPrompt} from '../types/types'
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const mockJournalData: DailyAnnoymousUserPrompt[] = [
    { latitude: 51.505, longitude: -0.09, emotion: "joy", prompt: "Feeling great today!", user_text: "User1" },
    { latitude: 40.7128, longitude: -74.006, emotion: "depressed", prompt: "Feeling down...", user_text: "User2" },
    { latitude: 35.6895, longitude: 139.6917, emotion: "angry", prompt: "Had a rough day!", user_text: "User3" },
    { latitude: 48.8566, longitude: 2.3522, emotion: "joy", prompt: "Loving Paris!", user_text: "User4" },
    { latitude: 34.0522, longitude: -118.2437, emotion: "depressed", prompt: "Missing home...", user_text: "User5" },
    { latitude: 55.7558, longitude: 37.6173, emotion: "angry", prompt: "Traffic is terrible!", user_text: "User6" },
    { latitude: 52.5200, longitude: 13.4050, emotion: "joy", prompt: "Berlin is amazing!", user_text: "User7" },
    { latitude: 37.7749, longitude: -122.4194, emotion: "depressed", prompt: "Feeling lonely...", user_text: "User8" },
    { latitude: 31.2304, longitude: 121.4737, emotion: "angry", prompt: "Work stress!", user_text: "User9" },
    { latitude: 28.6139, longitude: 77.2090, emotion: "joy", prompt: "Enjoying the culture!", user_text: "User10" },
    { latitude: -33.8688, longitude: 151.2093, emotion: "depressed", prompt: "Feeling homesick...", user_text: "User11" },
    { latitude: 35.6762, longitude: 139.6503, emotion: "angry", prompt: "Long day at work!", user_text: "User12" },
    { latitude: 19.0760, longitude: 72.8777, emotion: "joy", prompt: "Loving the food!", user_text: "User13" },
    { latitude: 51.1657, longitude: 10.4515, emotion: "depressed", prompt: "Missing family...", user_text: "User14" },
    { latitude: 41.9028, longitude: 12.4964, emotion: "angry", prompt: "Frustrated with traffic!", user_text: "User15" },
    { latitude: 40.4168, longitude: -3.7038, emotion: "joy", prompt: "Madrid is beautiful!", user_text: "User16" },
    { latitude: 39.9042, longitude: 116.4074, emotion: "depressed", prompt: "Feeling isolated...", user_text: "User17" },
    { latitude: 34.6937, longitude: 135.5023, emotion: "angry", prompt: "Busy day!", user_text: "User18" },
    { latitude: 55.9533, longitude: -3.1883, emotion: "joy", prompt: "Edinburgh is stunning!", user_text: "User19" },
    { latitude: 45.4642, longitude: 9.1900, emotion: "depressed", prompt: "Feeling blue...", user_text: "User20" },
    { latitude: 50.1109, longitude: 8.6821, emotion: "angry", prompt: "Annoyed with work!", user_text: "User21" },
];



const WorldMap = () => {
    const { data } = useWorldMap()
    const mapRef = useRef(null);
    const latitude = 51.505;
    const longitude = -0.09;

    const getEmotionIcon = (emotion: string) => {
        const iconOptions = {
            joy: FaceSmileSVG.src,
            depressed: FaceSadSVG.src,
            angry: FaceAngrySVG.src,
        };

        let emotionalURL
        if(emotion === "joy" || emotion === "depressed" || emotion === "angry"){
            emotionalURL = iconOptions[emotion]
        }else {
            emotionalURL = FaceSmileSVG.src
        }

        return L.icon({
            iconUrl: emotionalURL,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41],
        });
    };


    const annoymousPrompts = useMemo(() => {
        if(data?.prompts){
            return data.prompts
        }else {
            return mockJournalData
        }
    }, [data])

    if (typeof window === "undefined") {
        return null;
    }

    return (
        <div className="flex justify-center items-center mt-3">
            <MapContainer center={[latitude, longitude]} zoom={2} className="h-[80vh] w-[80vw]" ref={mapRef}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {annoymousPrompts
                .map((entry, index) => (
                <Marker
                    key={index}
                    position={[entry.latitude, entry.longitude]}
                    icon={getEmotionIcon(entry.emotion)}
                >
                    <Popup>{entry.user_text}</Popup>
                </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default WorldMap;
