"use client"
import dynamic from "next/dynamic";

const DynamicWorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default DynamicWorldMap;