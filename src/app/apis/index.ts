import axios from "axios";
import { DailyPromptRequestPayload, CollectiveRequestPayload, SubmitAIPromptPayload, ConvoPayload, ConvoEntriesPayload, AnnoymousUserPrompts, ConvoHistory, StreamAiPromptOptions } from "../types/types";
import { toast } from 'react-toastify';
import moment from 'moment-timezone';

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const signInUser = async (email: string, password: string) => {
    try {
        const response = await api.post(`/auth/signin`, { email, password });
        const { session } = response.data.data
        localStorage.setItem('authToken', session.access_token);
        localStorage.setItem('expiryDate', (Date.now() + 3600000).toString());
        return "success";
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const response = error.response.data.detail || "An error occurred during login";
            toast.error(response)
            throw new Error(response);
        } else {
            throw error;
        }
    }
}

export const signUpUser = async (email: string, password: string, age: number, name: string) => {
    try {
        const response = await api.post(`/auth/signup`, { email, password, age, name });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const response = error.response.data.detail || "An error occurred during signup";
            toast.error(response)
            throw new Error(response);
        } else {
            throw error;
        }
    }
}

export const signOutUser = async () => {
    try {
        const response = await api.post(`/auth/logout`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const response = error.response.data.detail || "An error occurred during sign out";
            toast.error(response)
            throw new Error(response);
        } else {
            throw error;
        }
    }
}

export const signOAuthUser = async () => {
    try {
        const response = await api.get(`/auth/google`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const response = error.response.data.detail || "An error occurred during sign out";
            toast.error(response)
            throw new Error(response);
        } else {
            throw error;
        }
    }
}
export const fetchUser = async () => {
    const token = localStorage.getItem('authToken');
    try {
        if (!token) {
            return { isLoggedIn: false };
        }
        const response = await api.get(`/auth/verify`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const { age, name, email } = response.data.user.user.user_metadata;
        return { isLoggedIn: response.data.is_logged_in, age, name, email };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error('Session not valid');
        } else {
            throw error;
        }
    }
};

export const getDailyPrompt = async () => {
    try {
        const response = await api.get(`/api/daily-prompt`);
        return response.data as DailyPromptRequestPayload;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while fetching the daily prompt')
            throw new Error('An error occurred while fetching the daily prompt');
        } else {
            throw error;
        }
    }
}

export const submitCollectivePrompt = async (request: CollectiveRequestPayload) => {
    try {
        const response = await api.post(`/api/collective-prompt`, request);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while submitting the prompt')
            throw new Error('An error occurred while submitting the prompt');
        } else {
            throw error;
        }
    }
}

export const getAnnoymousUserPrompts = async () => {
    try {
        const response = await api.get(`/api/user-prompts`);
        return response.data as AnnoymousUserPrompts;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while fetching the user prompts')
            throw new Error('An error occurred while fetching the user prompts');
        } else {
            throw error;
        }
    }
}

export const getConvoHistory = async () => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('User not authenticated');
        }
        const response = await api.get(`/api/get-cached-convo-history`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data as ConvoHistory;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while fetching the user prompts')
            throw new Error('An error occurred while fetching the user prompts');
        } else {
            throw error;
        }
    }
}


export async function* streamAiPromptGenerator(request: SubmitAIPromptPayload) {
    const authToken = localStorage.getItem('authToken');

    const response = await fetch(`${baseUrl}/api/stream-ai-prompt`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('ReadableStream is not supported or response body is null');
    }

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
            const chunkText = decoder.decode(value, { stream: true });
            yield chunkText;
        }
    }
}

export const saveConvoEntry = async (request: ConvoPayload) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('User not authenticated');
    }
    try {
        const timezone = moment.tz.guess();
        const updatedRequest = { ...request, timezone }
        console.log(updatedRequest)
        const response = await api.post(`/api/save-convo-entry`,
            updatedRequest,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while saving the conversation entry')
            throw new Error('An error occurred while saving the conversation entry');
        } else {
            throw error;
        }
    }
}

export const getConvoEntries = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('User not authenticated');
    }
    try {
        const response = await api.get(`/api/conversational-entries`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data as ConvoEntriesPayload;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while fetching the conversation entries')
            throw new Error('An error occurred while fetching the conversation entries');
        } else {
            throw error;
        }
    }
}

export const updateConvoSession = async (request: ConvoPayload) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('User not authenticated');
    }
    try {
        const response = await api.put(`/api/update-convo-session`, request, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data as ConvoEntriesPayload;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error('An error occurred while updating the conversation session');
        } else {
            throw error;
        }
    }
}


export const refreshConvoSession = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('User not authenticated');
    }
    try {
        const response = await api.delete(`/api/refresh-convo-session`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data as { message: string };
    }
    catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while refreshing the conversation session');
            throw new Error('An error occurred while refreshing the conversation session');
        } else {
            throw error;
        }
    }
}

export const deleteConvoEntry = async (id: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('User not authenticated');
    }
    try {
        const response = await api.delete(`/api/delete-convo-entry/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data as ConvoEntriesPayload;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while deleting the conversation entry')
            throw new Error('An error occurred while deleting the conversation entry');
        } else {
            throw error;
        }
    }

}

export const streamAiPrompt = async (
    request: {
        user_message: string;
        conversation_history: Array<{ user: string; therapist: string }>;
        timezone: string;
    },
    options?: StreamAiPromptOptions
) => {
    return new Promise(async (resolve, reject) => {
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${baseUrl}/api/stream-ai-prompt`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                return reject(
                    new Error(`Request failed: ${response.status} ${response.statusText}`)
                );
            }

            const reader = response.body?.getReader();
            if (!reader) {
                return reject(
                    new Error('ReadableStream not supported or body is null')
                );
            }

            const decoder = new TextDecoder();
            let done = false;
            let accumulatedText = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunkText = decoder.decode(value, { stream: true });
                    options?.onChunk?.(chunkText);
                    accumulatedText += chunkText;
                }
            }
            resolve(accumulatedText);
        } catch (error) {
            reject(error);
        }
    });
}

