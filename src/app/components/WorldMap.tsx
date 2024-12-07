"use client"
import dynamic from "next/dynamic";
import React, { useRef } from "react";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });


const WorldMap = () => {
    const mapRef = useRef(null);
    const latitude = 51.505;
    const longitude = -0.09;

    return (
        <div className="flex justify-center items-center mt-3">
            <MapContainer center={[latitude, longitude]} zoom={13} ref={mapRef} className="h-80 w-80">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>
        </div>

    );
};

export default WorldMap;