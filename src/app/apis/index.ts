import axios from "axios";
import {DailyPromptRequestPayload, CollectiveRequestPayload, SubmitAIPromptPayload , SaveConvoEntryPayload, ConvoEntriesPayload, AnnoymousUserPrompts } from "../types/types";
import { toast } from 'react-toastify';

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
        const {session} = response.data.data
        localStorage.setItem('authToken', session.access_token);
        return "success";
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const response = error.response.data.detail || "An error occurred during login";
            toast.error(response)
            throw new Error(response);
        } else {
            toast.error(String(error))
            throw error;
        }
    }
}

export const signUpUser = async (email: string, password: string, age: number , name: string) => {
    try {
        const response = await api.post(`/auth/signup`, { email, password , age , name});
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const response = error.response.data.detail || "An error occurred during signup";
            toast.error(response)
            throw new Error(response);
        } else {
            toast.error(String(error))
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
            toast.error(String(error))
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
            toast.error(String(error))
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
            toast.error('Session not valid')
            throw new Error('Session not valid');
        } else {
            toast.error(String(error))
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
            toast.error(String(error))
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
            toast.error(String(error))
            throw error;
        }
    }
}

export const getAnnoymousUserPrompts = async() => {
    try {
        const response = await api.get(`/api/user-prompts`);
        return response.data as AnnoymousUserPrompts;
    }catch (error){
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while fetching the user prompts')
            throw new Error('An error occurred while fetching the user prompts');
        } else {
            toast.error(String(error))
            throw error;
        }
    }
}

export const submitAiPromptPayload = async (request: SubmitAIPromptPayload) => {
    try {
        const response = await api.post(`/api/stream-ai-prompt`, request);
        return response.data;
    }catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while submitting the AI prompt')
            throw new Error('An error occurred while submitting the AI prompt');
        } else {
            toast.error(String(error))
            throw error;
        }
    }

}


export const saveConvoEntry = async (request: SaveConvoEntryPayload) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('User not authenticated');
    }
    try {
        const response = await api.post(`/api/save-convo-entry`, request, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            toast.error('An error occurred while saving the conversation entry')
            throw new Error('An error occurred while saving the conversation entry');
        } else {
            toast.error(String(error))
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
        const response = await api.get(`/api/convo-entries`, {
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
            toast.error(String(error))
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
            toast.error(String(error))
            throw error;
        }
    }

}
