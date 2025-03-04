import { useMutation } from 'react-query';
import { streamAiPrompt, saveConvoEntry, updateConvoSession } from '../apis';
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { useState } from 'react';
import moment from 'moment-timezone';


type Message = {
    sender: string,
    text: string
}

export const useChatBot = () => {
    const router = useRouter();
    const timezone = moment.tz.guess();
    const [messages, setMessages] = useState<Array<Message>>([]);
    const [input, setInput] = useState("");

    const { mutateAsync: mutateAsyncStream } = useMutation(
        (args: {
            user_message: string;
            conversation_history: Array<{ user: string; therapist: string }>;
            timezone: string;
            onChunk?: (chunk: string) => void;
        }) => {
            return streamAiPrompt(
                {
                    user_message: args.user_message,
                    conversation_history: args.conversation_history,
                    timezone: args.timezone,
                },
                { onChunk: args.onChunk }
            );
        }
    );


    const { mutateAsync: mutateAsyncUpdateConvoSession } = useMutation("updateConvoSession", updateConvoSession)


    const { mutateAsync: mutateAsyncSaveConvo, isLoading: saveEntryLoading } = useMutation(saveConvoEntry, {
        onSuccess: () => {
            toast.success("Conversation saved successfully")
            router.push("/entries")
        },
        onError: (error: AxiosError) => {
            toast.error(error.message)
        }
    });


    const transformMessages = (messages: Array<Message>): Array<{
        user: string;
        therapist: string;
    }> => {
        const result: Array<{ user: string; therapist: string; }> = [];
        let currentMessage: { user: string, therapist: string } = { user: "", therapist: "" };

        messages?.forEach(({ sender, text }: Message) => {
            if (sender === "user:") {
                currentMessage["user"] = text || "";
            } else if (sender === "therapist") {
                currentMessage["therapist"] = text;
                result.push({ ...currentMessage });
                currentMessage = { user: "", therapist: "" };
            }
        });

        return result;
    }

    const sendMessage = async () => {
        if (input.trim() && messages) {
            const newMessages = [...messages, { sender: 'user:', text: input }];
            newMessages.push({ sender: 'therapist', text: '' });
            setMessages(newMessages);

            const conversationHistory = transformMessages(newMessages);

            await handleStreamAiPrompt(input, conversationHistory, (chunk) => {
                setMessages((prev) => {
                    if (!prev) return prev;
                    const copy = [...prev];
                    const lastIndex = copy.length - 1;
                    if (lastIndex >= 0 && copy[lastIndex].sender === 'therapist') {
                        copy[lastIndex] = {
                            ...copy[lastIndex],
                            text: copy[lastIndex].text + chunk,
                        };
                    }
                    return copy;
                });
            })

            await handleUpdateConvoSession(transformMessages(messages));
            setInput('');
        }
    };

    const handleConvoEntries = () => {
        if (messages) {
            const conversationHistory = transformMessages(messages)
            saveConvoEntires(conversationHistory)
        }
    }

    const handleUpdateConvoSession = async (conversationHistory: Array<{ user: string, therapist: string }>) => {
        return await mutateAsyncUpdateConvoSession({ conversation_history: conversationHistory })
    }

    const handleStreamAiPrompt = async (
        userText: string,
        conversationHistory: Array<{ user: string; therapist: string }>,
        onChunk?: (chunk: string) => void
    ) => {
        return await mutateAsyncStream({
            user_message: userText,
            conversation_history: conversationHistory,
            timezone,
            onChunk,
        });
    };

    const saveConvoEntires = async (conversationHistory: Array<{ user: string, therapist: string }>) => {
        return await mutateAsyncSaveConvo({
            conversation_history: conversationHistory,
            timezone
        });
    }



    return {
        handleStreamAiPrompt,
        saveConvoEntires,
        handleUpdateConvoSession,
        saveEntryLoading,
        messages,
        input,
        setInput,
        sendMessage,
        handleConvoEntries
    };

}