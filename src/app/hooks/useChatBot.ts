
import { useMutation, useQuery } from 'react-query';
import { streamAiPrompt, getConvoHistory, saveConvoEntry, refreshConvoSession , updateConvoSession} from '../apis';
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export const useChatBot = () => {
    const router = useRouter();

    const { isLoading: chatHistoryLoading, data: historyTexts, refetch: refetchHistory } = useQuery("chatHistory", getConvoHistory)

    const { mutateAsync: mutateAsyncStream} = useMutation(
        (args: {
            user_message: string;
            conversation_history: Array<{ user: string; therapist: string }>;
            onChunk?: (chunk: string) => void;
        }) => {
            return streamAiPrompt(
                {
                    user_message: args.user_message,
                    conversation_history: args.conversation_history,
                },
                { onChunk: args.onChunk }
            );
        }
    );

    const { mutateAsync: mutateAsnycResetConvoSession } = useMutation("resetConvoSession", refreshConvoSession,{onSuccess: () => {
            refetchHistory()
        }
    });

    const {mutateAsync: mutateAsyncUpdateConvoSession } = useMutation("updateConvoSession", updateConvoSession)


    const { mutateAsync: mutateAsyncConvoHistory } = useMutation(saveConvoEntry, {
        onSuccess: () => {
            toast.success("Conversation saved successfully")
            router.push("/entries")
        },
        onError: (error: AxiosError) => {
            toast.error(error.message)
        }
    });

    const handleResetConvoSession = async () => {
        return await mutateAsnycResetConvoSession();
    }

    const handleUpdateConvoSession = async (conversationHistory: Array<{ user: string, therapist: string }>) => {
        return await mutateAsyncUpdateConvoSession({conversation_history: conversationHistory})
    }

    const handleStreamAiPrompt = async (
        userText: string,
        conversationHistory: Array<{ user: string; therapist: string }>,
        onChunk?: (chunk: string) => void
    ) => {
        return await mutateAsyncStream({
            user_message: userText,
            conversation_history: conversationHistory,
            onChunk,
        });
    };

    const saveConvoEntires = async (conversationHistory: Array<{ user: string, therapist: string }>) => {
        return await mutateAsyncConvoHistory({ conversation_history: conversationHistory });
    }

    return {
        handleStreamAiPrompt,
        handleResetConvoSession,
        chatHistoryLoading,
        historyTexts,
        saveConvoEntires,
        handleUpdateConvoSession
    };

}