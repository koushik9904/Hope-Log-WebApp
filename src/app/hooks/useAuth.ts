import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from "react-query";
import { signInUser, signOutUser, signUpUser, fetchUser } from '../apis';
import { useRouter } from 'next/navigation'
import { AxiosError } from "axios";

type userMetaData ={
    name: string ,
    email: string ,
    age: number
}

export const useAuth = () => {
    const [userMetaData, setUserMetaData] = useState<userMetaData | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const { mutateAsync: loginMutateAsync, isLoading: loginIsLoading, error: loginError } = useMutation((variables: { email: string, password: string }) => signInUser(variables.email, variables.password), {
        onSuccess: () => {
            verifySession(); 
            router.push("/")
        },
        onError: (error: AxiosError) => {
            setLoginErrorMessage(error.message)
        }
    });

    const {mutateAsync: logOutMutateAsync , isLoading: logOutIsLoading } = useMutation(signOutUser, {
        onSuccess: () => {
            localStorage.removeItem('authToken');
            setIsLoggedIn(false);
            setUserMetaData(null);
            queryClient.clear(); 
            router.push("/")
        },
    });

    const signUpMutation = useMutation((variables: { email: string, password: string, age: number, name: string }) => signUpUser(variables.email, variables.password, variables.age, variables.name), {
        onSuccess: () => {
            router.push("/signupVerification")
        },
    });

    const { refetch: verifySession } = useQuery(
        'verifySession',
        fetchUser,
        {
            enabled: false, 
            onSuccess: (data) => {
                setIsLoggedIn(data.isLoggedIn);
                setUserMetaData({ name: data.name, email: data.email, age: data.age });
            },
            onError: () => {
                setIsLoggedIn(false);
                setUserMetaData(null);
            },
        }
    );

    const handleSignUp = async (email: string, password: string, age: number, name: string) => {
        return await signUpMutation.mutateAsync({ email, password, age, name });
    }


    const handleLogin = async (email: string, password: string) => {
        return await loginMutateAsync({ email, password });

    };

    const handleLogout = async () => {
        await logOutMutateAsync();
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const expiryDateString = localStorage.getItem('expiryDate');
        const expiryDate = expiryDateString ? JSON.parse(expiryDateString) : null;
        if(expiryDate && Date.now() > expiryDate){
            localStorage.removeItem('authToken');
            localStorage.removeItem('expiryDate');
            return
        }
        if (token && expiryDate && new Date(expiryDate) > new Date()) {
            verifySession();
        }
    }, [verifySession]);


    return {
        userMetaData,
        isLoggedIn,
        loginIsLoading,
        loginError,
        loginErrorMessage,
        logOutIsLoading,
        handleLogin,
        handleLogout,
        handleSignUp
    };


}