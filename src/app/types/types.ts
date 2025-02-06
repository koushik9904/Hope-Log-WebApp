export type ConvoPayload = {
    conversation_history: Array<{
        user: string
        therapist: string
    }>,
    timezone?: string
}

interface Emotion {
    emotion: string;
    evidence: string;
    intensity: number;
}

export type ConvoEntry = {
    id: string,
    title: string
    summary: string
    analysis: string
    created_at: string
    emotions: Emotion[]
}

export type DailyAnnoymousUserPrompt = {
    user_text: string,
    emotion: string
    latitude: number,
    longitude: number,
    prompt: string
}

export type AnnoymousUserPrompts = {
    prompts: Array<DailyAnnoymousUserPrompt>
}


export type CollectiveRequestPayload = {
    user_text: string,
    emotion: string,
    prompt: string
}

export type DailyPromptRequestPayload = {
    prompt: string,
    emotion: string
}

export type SubmitAIPromptPayload = {
    user_message: string
    conversation_history: Array<{ user: string, therapist: string }>
}

export type SaveConvoEntryPayload = {
    conversation_history: ConvoPayload
}


export type ConvoEntriesPayload = {
    entries: Array<ConvoEntry>,
    entries_this_month: number,
    is_subscribed: boolean,
    user_id?: string
}

export type ConvoHistory = {
    conversation_history: Array<{ user: string, therapist: string }>
}

export type StreamAiPromptOptions = {
    onChunk?: (chunk: string) => void;
};