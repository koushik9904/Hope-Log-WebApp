'use client'
import { useState } from "react";
import { useRouter } from 'next/navigation'
import moment from "moment";
import { SearchIconSVG, WriteIconSVG, TrashSVG } from "../assets/assets";
import Image from "next/image";
import {Modal} from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';


type Entry = {
    title: string;
    date: string;
    content: string;
    analysis: string;
};

const mockEntries = [
    {
        title: "Feeling Excited About Building An App",
        date: moment().subtract(1, "days").format("dddd, MMMM Do @ h:mm a"),
        content:
            "I feel so excited about starting this app for the hackathon. I've been thinking about all the features I could include, and it’s sparking so many creative ideas in my mind. This project feels like a fresh challenge, and it’s giving me a real sense of purpose and motivation. I can’t wait to dive deeper into it!",
        analysis:
            "Embracing this excitement can fuel your productivity and innovation as you work on your app. Channeling this energy into your project might lead to rewarding outcomes.",
    },
    {
        title: "Feeling Lethargic From Lack Of Sleep",
        date: moment().format("dddd, MMMM Do @ h:mm a"),
        content:
            "I’ve been feeling so drained today because I didn’t get enough sleep last night. My energy levels are really low, and it’s been hard to focus on anything. I know I need to take better care of myself and prioritize rest, but it’s been tough to stick to a consistent schedule lately.",
        analysis:
            "Acknowledging the importance of rest can help you regain balance and function effectively. Consider creating a better sleep routine.",
    },
];

const Entries = () => {
    const [entries, setEntries] = useState<Array<Entry>>(mockEntries);
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
    const [popoverVisible, setPopoverVisible] = useState<number | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const onOpenDetailsModal = () => setDetailsOpen(true);
    const onCloseDetailsModal = () => setDetailsOpen(false);

    const router = useRouter();

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
                            <p className="text-sm">{selectedEntry.date}</p>
                            <div className="mt-4">
                                <h3 className="font-medium">Summary</h3>
                                <p>{selectedEntry.content}</p>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-medium">Analysis</h3>
                                <p>{selectedEntry.analysis}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
            <div className="container mx-auto p-4 text-white">
                <div className="flex justify-between items-center">
                    <div className="relative w-full md:w-2/6 mb-4">
                        <input
                            type="text"
                            placeholder="  Search entries..."
                            className="w-full p-3 pl-12 rounded bg-message"
                            onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                setEntries(
                                    mockEntries.filter((entry) =>
                                        entry.title.toLowerCase().includes(searchTerm)
                                    )
                                );
                            }}
                        />
                        <button className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Image
                                src={SearchIconSVG}
                                alt="search"
                            />
                        </button>
                    </div>
                    <button onClick={() => router.push("/chatbot")} className="bg-ascent hidden md:flex p-4 rounded flex items-center mb-4">
                        <Image
                            src={WriteIconSVG}
                            width={15}
                            className="mr-2"
                            alt="write" />
                        New
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-5">

                    <div className="bg-message rounded shadow-md w-full md:w-1/3">
                        <h1 className="text-lg font-bold p-4 border-b">This Week</h1>
                        <div className="divide-y">
                            {entries.map((entry, index) => (
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
                                    <div className="block md:hidden">
                                        {entry.title}
                                    </div>
                                    <div className="hidden md:block">
                                        {entry.title}
                                    </div>
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
                                                        setEntries(entries.filter((_, i) => i !== index)); 
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
                                <p className="text-sm text-white">{selectedEntry.date}</p>
                                <div className="mt-4">
                                    <h3 className="font-medium">Summary</h3>
                                    <p>{selectedEntry.content}</p>
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-medium">Analysis</h3>
                                    <p>{selectedEntry.analysis}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-white">Select an entry to view details</p>
                        )}
                    </div>
                    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 md:hidden mb-5">
                        <button className="bg-ascent p-4 rounded-full flex items-center justify-center w-12 h-12" onClick={() => router.push("/chatbot")} >
                            <Image
                                src={WriteIconSVG}
                                width={15}
                                alt="write"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Entries
