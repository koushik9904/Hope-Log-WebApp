import axios from "axios";

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
            return error.response.data;
        } else {
            throw error;
        }
    }
}

export const signUpUser = async (email: string, password: string) => {
    try {
        const response = await api.post(`/auth/signup`, { email, password });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
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
            return error.response.data;
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
            return error.response.data;
        } else {
            throw error;
        }
    }
}
export const fetchUser = async () => {
    const token = localStorage.getItem('authToken');
    try {
        const response = await api.get(`/auth/verify/?token=${token}`);
        return response.data.is_logged_in;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error('Session not valid');
        } else {
            throw error;
        }
    }
};