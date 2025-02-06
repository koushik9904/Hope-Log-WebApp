import { useMutation, useQuery } from 'react-query';
import { createSubscription, getPaymentIntent } from '../apis';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export const useCheckout = () => {
    const router = useRouter();

    const { data: paymentIntent, isLoading: isLoadingIntent } = useQuery(
        'paymentIntent',
        getPaymentIntent,
        {
            retry: false,
            onError: (error: Error) => {
                toast.error('Failed to initialize payment: ' + error.message);
            }
        }
    );
    const {
        mutate: handleSubscription,
        isLoading: isSubscribing,
        error,
        isError,
        reset: resetError
    } = useMutation((paymentMethodId: string) => createSubscription(paymentMethodId), {
        onSuccess: (data) => {
            if (data.status === 'active') {
                toast.success('Successfully subscribed to Pro plan!');
                router.push('/chatbot');
            }
        },
        onError: (error: Error) => {
            toast.error('Failed to process subscription: ' + error.message);
        }
    });

    const handleCardDetails = async (paymentMethodId: string) => {
        await handleSubscription(paymentMethodId);
    };

    return {
        clientSecret: paymentIntent?.clientSecret,
        handleCardDetails ,
        isLoading: isLoadingIntent || isSubscribing,
        error: isError ? (error as Error).message : null,
        resetError
    };
}; 