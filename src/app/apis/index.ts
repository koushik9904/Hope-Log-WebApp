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
            throw new Error(error.response.data.detail || "An error occurred during login");
        } else {
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
            throw new Error(error.response.data.detail || "An error occurred during signup");
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
            throw new Error(error.response.data.detail || "An error occurred during sign out");
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
            throw new Error(error.response.data?.detail || "An error occurred during sign out");
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

