import { useMutation } from "react-query";
import { signInUser, signOutUser} from '../apis';
import { useRouter } from 'next/navigation'

export const useAuth = () => {

    const router = useRouter();

    const loginMutation = useMutation((variables: { email: string, password: string }) => signInUser(variables.email, variables.password), {
        onSuccess: () => {
        },
    })

    const logoutMutation = useMutation(signOutUser, {
        onSuccess: () => {
            localStorage.removeItem('authToken');
            router.push("/")
        },
    });

    const handleLogin = async (email: string, password: string) => {
       return await loginMutation.mutateAsync({ email, password });
    };

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
    };


  return {
    handleLogin,
    handleLogout
  };


}