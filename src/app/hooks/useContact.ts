import { useMutation } from 'react-query';
import { sendEmail } from '../apis';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export const useContact = () => {
    const { mutateAsync, isLoading } = useMutation(
        async ({ title, message }: { title: string; message: string }) => {
            try {
                const response = await sendEmail(title, message);
                toast.success('Message sent successfully!');
                return response;
            } catch (error) {
                const axiosError = error as AxiosError<{message: string}>;
                toast.error(axiosError.response?.data?.message || 'Failed to send message');
                throw error;
            }
        }
    );

    const handleContactForm = async (title: string, message: string) => {
        await mutateAsync({ title, message });
    };

    return {
        handleContactForm,
        isLoading
    };
};

