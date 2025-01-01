import { useMutation, useQuery } from "react-query";
import { getDailyPrompt, submitCollectivePrompt } from "../apis";

export const useDailyPrompts = () => {
 const {isLoading, data} = useQuery('dailyPrompt', getDailyPrompt);

 const submitPrompMutation = useMutation(submitCollectivePrompt);

 const handlePromptSubmit = async (userText: string) => {
    return await submitPrompMutation.mutateAsync({user_text: userText, emotion: data?.emotion || "neutral", prompt: data?.prompt || ""});
 }

 return {isLoading, data, handlePromptSubmit};

}