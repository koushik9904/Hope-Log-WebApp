import { useMutation, useQuery } from 'react-query';
import { streamAiPrompt, getConvoHistory, saveConvoEntry, refreshConvoSession, updateConvoSession } from '../apis';
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useState, useMemo } from 'react';
import moment from 'moment-timezone';


type Message = {
    sender: string,
    text: string
}

export const useChatBot = () => {
    const router = useRouter();
    const timezone = moment.tz.guess(); // Get user's timezone
    const [messages, setMessages] = useState<Array<Message>>([]);
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const {
        transcript,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const { isLoading: chatHistoryLoading, data: historyTexts, refetch: refetchHistory } = useQuery("chatHistory", getConvoHistory)

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

    const { mutateAsync: mutateAsnycResetConvoSession } = useMutation("resetConvoSession", refreshConvoSession, {
        onSuccess: () => {
            refetchHistory()
        }
    });

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

    useMemo(() => {
        const newHistoryTexts: Array<Message> = []
        historyTexts?.conversation_history.forEach((history: { user: string, therapist: string }) => {
            newHistoryTexts.push({ sender: "user:", text: history.user }, { sender: "therapist", text: history.therapist })
        });
        setMessages(newHistoryTexts)
    }, [historyTexts])

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

            const response = await handleStreamAiPrompt(input, conversationHistory, (chunk) => {
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

            const updatedMessage = [...messages, { sender: 'user:', text: input }, { sender: 'therapist', text: response }];
            await handleUpdateConvoSession(transformMessages(updatedMessage));
            setInput('');
        }
    };

    const handleConvoEntries = () => {
        if (messages) {
            const conversationHistory = transformMessages(messages)
            saveConvoEntires(conversationHistory)
        }
    }

    const handleResetConvoSession = async () => {
        return await mutateAsnycResetConvoSession();
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

    const handleVoiceInput = (setInput: (value: string) => void) => {
        if (isListening) {
            SpeechRecognition.stopListening();
            setIsListening(false);
            if (transcript) {
                setInput(transcript);
                resetTranscript();
            }
        } else {
            SpeechRecognition.startListening({ continuous: true });
            setIsListening(true);
            setInput('');
            resetTranscript();
        }
    };

    return {
        handleStreamAiPrompt,
        handleResetConvoSession,
        chatHistoryLoading,
        historyTexts,
        saveConvoEntires,
        handleUpdateConvoSession,
        saveEntryLoading,
        handleVoiceInput,
        isListening,
        browserSupportsSpeechRecognition,
        messages,
        input,
        setInput,
        sendMessage,
        handleConvoEntries
    };

}