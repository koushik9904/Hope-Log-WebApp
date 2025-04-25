import { useMutation, useQuery } from 'react-query';
import { getAccountDetails, cancelSubscription } from '../apis';

export const useAccountDetails = () => {
    const { data: accountDetails, isLoading: isLoadingDetails, refetch: refetchDetails } = useQuery(
        'accountDetails',
        getAccountDetails
    );
    const { mutateAsync: cancelSubscriptionAsync, isLoading: isCancelling } = useMutation(
        (subscription_id: string) => cancelSubscription(subscription_id),
        {
            onSuccess: () => {
                refetchDetails();
            }
        }
    );

    const handleCancelSubscription = async (subscription_id: string) => {
        await cancelSubscriptionAsync(subscription_id);
    };

    return {
        accountDetails,
        isLoadingDetails,
        handleCancelSubscription,
        isCancelling
    };
};
