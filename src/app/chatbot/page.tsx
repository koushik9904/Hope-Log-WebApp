'use client'
import 'regenerator-runtime/runtime';
import { LoginCircleSVG } from "../assets/assets";
import Image from "next/image";
import WithAuth from "../HOC/WithAuth";
import { useChatBot } from "../hooks/useChatBot";
import { BounceLoader } from 'react-spinners';
import DisclaimerModal from "../components/DisclaimerModal";

const ChatComponent = () => {
    const {
        chatHistoryLoading,
        saveEntryLoading,
        messages,
        input,
        setInput,
        sendMessage,
        handleConvoEntries
    } = useChatBot();

    return (
        <div className="bg-dark text-white min-h-screen flex justify-center px-4 sm:px-6 lg:px-8 mt-20 relative">
            <DisclaimerModal />
            {chatHistoryLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
                    <BounceLoader color="#ffffff" />
                    <p className="text-white mt-4">Loading Convo Session...</p>
                </div>
            )}
            {saveEntryLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
                    <BounceLoader color="#ffffff" />
                    <p className="text-white mt-4">Saving entry...</p>
                </div>
            )}
            <div className="md:w-9/12 w-full bg-dark rounded-lg p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center">
                        <h1 className="text-5xl font-bold">Hey there! 👋</h1>
                        <p className="mt-5 text-2xl text-gray-300">
                            I'm your friendly buddy, here to make life easier—answering
                            questions, solving problems, or chatting about your ideas.
                        </p>
                        <p className="mt-5 text-gray-300">
                            Think of me as your smart, supportive sidekick. Let's dive in
                            together!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.sender === 'user:' ? 'justify-end' : 'justify-start'}`}>
                                <div>
                                    <div className="flex justify-end">
                                        <strong className="text-sm text-gray-400">{message.sender === 'user:' && 'You:'}</strong>
                                    </div>
                                    {message.sender === 'therapist' && (
                                        <div className="flex justify-start mt-3 ml-3">
                                            <strong className="text-sm text-gray-400">
                                                Hopelog:
                                            </strong>
                                        </div>
                                    )}
                                    <div className={`${message.sender === "user:" ? "bg-message bg-opacity-50" : ""} text-white p-4 mt-2 rounded-lg`}>
                                        <div>{message.text}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="w-full p-4 bg-dark pt-[20rem]">
                    <div className="flex w-full relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Message HopeLog"
                            rows={5}
                            className="flex-grow bg-message text-white border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 pr-24"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                            <button
                                onClick={sendMessage}
                                className="bg-transparent border-none cursor-pointer"
                            >
                                <Image
                                    src={LoginCircleSVG}
                                    alt="Send"
                                />
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-center mt-4 w-full">
                        <button
                            onClick={handleConvoEntries}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg w-full"
                        >
                            Finish Entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default WithAuth(ChatComponent) 