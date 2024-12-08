'use client'
import { useSearchParams } from "next/navigation";
import { ChevronLeftSVG } from "../assets/assets";
import Image from "next/image";
import { Suspense } from "react";


const EntryDetailsContent = () => {
    const searchParams = useSearchParams();
    const title = searchParams.get('title') || 'Untitled';
    const date = searchParams.get('date') || 'No date provided';
    const content = searchParams.get('content') || 'No content available';
    const analysis = searchParams.get('analysis') || 'No analysis provided';



    return (
        <div className="min-h-screen bg-dark px-4 py-6">
            <button className="flex items-center text-white mb-4" onClick={() => window.history.back()}>
                <Image src={ChevronLeftSVG} alt="back" className="w-6 h-6 mr-2" />
                Back
            </button>
            <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                <p className="text-gray-600">
                    <strong className="font-semibold">Date:</strong> {date}
                </p>
                <p className="text-gray-600">
                    <strong className="font-semibold">Content:</strong> {content}
                </p>
                <p className="text-gray-600">
                    <strong className="font-semibold">Analysis:</strong> {analysis}
                </p>
            </div>
        </div>
    );
};

const EntryDetails = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EntryDetailsContent />
        </Suspense>
    );
};


export default EntryDetails;
