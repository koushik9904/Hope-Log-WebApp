'use client'
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Modal } from 'react-responsive-modal';
import Image from "next/image";
import { WriteIconSVG, TrashSVG } from "../assets/assets";
import WithAuth from "../HOC/WithAuth";
import { ConvoEntry } from "../types/types";
import 'react-responsive-modal/styles.css';
import useEntries from "../hooks/useEntries";
import { BounceLoader } from 'react-spinners';
import { EMOTION_TO_EMOTICON } from "../constants/constants";
import uniqid from 'uniqid';


const Entries = () => {
    const { data: entries, handleDeleteEntry, isLoading } = useEntries();
    const [selectedEntry, setSelectedEntry] = useState<ConvoEntry | null>(null);
    const [popoverVisible, setPopoverVisible] = useState<number | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const onOpenDetailsModal = () => setDetailsOpen(true);
    const onCloseDetailsModal = () => setDetailsOpen(false);
    const router = useRouter();

    const renderEmotionPill = (emotion: string) => {
        const emoticon = EMOTION_TO_EMOTICON[emotion as keyof typeof EMOTION_TO_EMOTICON] || '';
        return (
            <span key={`emotion-${uniqid()}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white mr-2 mb-2">
                {emoticon} {emotion}
            </span>
        );
    };

    return (
        <>
            <Modal
                open={detailsOpen}
                styles={{ modal: { background: "#59596E", borderRadius: '1rem' }, closeIcon: { fill: "#fff" } }}
                onClose={onCloseDetailsModal}
                center
                classNames={{ modal: "w-full h-full bg-message flex justify-center items-center" }}
            >
                <div className="w-full h-full bg-message rounded-lg shadow-lg flex flex-col p-6">
                    {selectedEntry && (
                        <div className="text-white">
                            <h2 className="text-2xl mb-4">{selectedEntry.title}</h2>
                            <p className="text-sm">{selectedEntry.created_at}</p>
                            <div className="mt-4">
                                <h3 className="font-medium">Summary</h3>
                                <p>{selectedEntry.summary}</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-medium">Analysis</h3>
                                <p>{selectedEntry.analysis}</p>
                            </div>
                            <div className="mt-4">
                                {selectedEntry.emotions &&
                                    <>
                                        <h3 className="font-medium">Emotions Identified</h3><div className="mt-2">
                                            <div className="mb-3 flex items-center">
                                                {selectedEntry.emotions?.map((emotion, index) => (
                                                    renderEmotionPill(emotion.emotion, index)
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                }

                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <div className="container mx-auto ml-auto p-4 text-white">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => router.push("/chatbot")}
                        className="bg-ascent hidden md:flex p-4 rounded flex items-center mb-4 ml-auto"
                    >
                        <Image src={WriteIconSVG} width={15} className="mr-2" alt="write" />
                        New
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <BounceLoader color="#36d7b7" />
                        <p className="text-white mt-4">Loading entries...</p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-5">
                        <div className="bg-message rounded shadow-md w-full md:w-1/3">
                            <div className="divide-y">
                                {entries && entries.entries.map((entry: ConvoEntry, index: number) => (
                                    <div
                                        key={index}
                                        className="p-4 border-b hover:bg-mutedHover cursor-pointer relative group"
                                        onClick={() => {
                                            setSelectedEntry(entry);
                                            if (window.innerWidth < 768) {
                                                onOpenDetailsModal();
                                            }
                                        }}
                                    >
                                        <div className="block md:hidden">{entry.title}</div>
                                        <div className="hidden md:block">{entry.title}</div>
                                        <button
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPopoverVisible(index);
                                            }}
                                        >
                                            <Image src={TrashSVG} width={24} alt="delete" />
                                        </button>
                                        {popoverVisible === index && (
                                            <div
                                                className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-white border rounded-lg shadow-lg p-4 flex items-center space-x-4 z-50"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <p className="text-sm text-dark">Are you sure you want to delete this entry?</p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                                                        onClick={() => {
                                                            handleDeleteEntry(entry.id);
                                                            setPopoverVisible(null);
                                                        }}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-400"
                                                        onClick={() => setPopoverVisible(null)}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block bg-message rounded shadow-md w-full md:w-2/3 p-4">
                            {selectedEntry ? (
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedEntry.title}</h2>
                                    <p className="text-sm text-white">{selectedEntry.created_at}</p>
                                    <div className="mt-4">
                                        <h3 className="font-medium">Summary</h3>
                                        <p>{selectedEntry.summary}</p>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-medium">Analysis</h3>
                                        <p>{selectedEntry.analysis}</p>
                                    </div>
                                    <div className="mt-4">
                                        {selectedEntry.emotions &&
                                            <>
                                                <h3 className="font-medium">Emotions Identified</h3><div className="mt-2">
                                                    <div className="mb-3 flex items-center">
                                                        {selectedEntry.emotions?.map((emotion, index) => (
                                                            renderEmotionPill(emotion.emotion, index)
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        }
                                    </div>
                                </div>
                            ) : (
                                entries && entries.entries.length > 0 ? (
                                    <p className="text-white">Select an entry to view details</p>
                                ) : (
                                    <p className="text-white">No entries available. Create an entry to begin.</p>
                                )
                            )}
                        </div>

                        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 md:hidden mb-5">
                            <button
                                className="bg-ascent p-4 rounded-full flex items-center justify-center w-12 h-12"
                                onClick={() => router.push("/chatbot")}
                            >
                                <Image src={WriteIconSVG} width={15} alt="write" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default WithAuth(Entries);
