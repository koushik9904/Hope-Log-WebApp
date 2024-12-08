'use client'
import { useState } from "react";
import { LoginCircleSVG ,HopeIconSVG} from "../assets/assets";
import Image from "next/image";

type Message = {
    sender: string,
    text: string
}

const defaultMockMessages: Array<Message> = [
    {
        sender: "You:",
        text: "Hey… I’m just feeling really overwhelmed lately. Everything feels like too much, and I don’t know where to start fixing it."
    },
    {
        sender: "Bot",
        text: "I’m really sorry to hear that. 💛 Feeling overwhelmed can be so heavy. You’re not alone in this—I’m here with you. Want to tell me a bit more about what’s been weighing on you?"
    }
];



export default function ChatComponent() {

    const [messages, setMessages] = useState<Array<Message>>(defaultMockMessages);
    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (input.trim()) {
            setMessages([...messages, { sender: "You:", text: input }]);
            setInput("");
        }
    };

    return (
        <div className="bg-dark text-white min-h-screen flex justify-center px-4 sm:px-6 lg:px-8 mt-20">
            <div className="md:w-9/12 w-full bg-dark rounded-lg p-6 space-y-4">

                {messages.length === 0 ? (
                    <div className="text-center">
                        <h1 className="text-5xl font-bold">Hey there! 👋</h1>
                        <p className="mt-5 text-2xl text-gray-300">
                            I'm your friendly buddy, here to make life easier—answering
                            questions, solving problems, or chatting about your ideas.
                        </p>
                        <p className="mt-5 text-gray-300">
                            Think of me as your smart, supportive sidekick. Let’s dive in
                            together!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.sender === 'You:' ? 'justify-end' : 'justify-start'}`}>
                                <div>
                                    <div className="flex justify-end">
                                        <strong className="text-sm text-gray-400">{message.sender === 'You:' && message.sender}</strong>
                                    </div>
                                    {message.sender === 'Bot' && (
                                    <div className="flex justify-start mt-3 ml-3">
                                        <strong className="text-sm text-gray-400">
                                            <Image
                                                src={HopeIconSVG}
                                                alt="icon"
                                            
                                            />
                                        </strong>
                                    </div>)}
                                    <div className={`${message.sender === "You:" ? "bg-message bg-opacity-50" : ""} text-white p-4 mt-2 rounded-lg`}>
                                        <div>{message.text}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-center w-full p-4 bg-dark pt-[20rem]">
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
                            className="flex-grow bg-message text-white border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button
                            onClick={sendMessage}
                            className="absolute bottom-2 right-2 bg-transparent border-none cursor-pointer"
                        >
                            <Image
                                src={LoginCircleSVG}
                                alt="icon"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
