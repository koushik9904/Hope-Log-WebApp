'use client';

import { useAccountDetails } from '../hooks/useAccountDetails';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Modal } from 'react-responsive-modal';
import WithAuth from '../HOC/WithAuth';
import 'react-responsive-modal/styles.css';
import { useRouter } from 'next/navigation';

function AccountDetailsPage() {
    const router = useRouter();
    const { accountDetails, isLoadingDetails, handleCancelSubscription, isCancelling } = useAccountDetails();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const handleCancelClick = async () => {
        try {
            await handleCancelSubscription(accountDetails?.subscription_id);
            toast.success('Subscription cancelled successfully');
            setShowCancelModal(false);
        } catch (error) {
            toast.error('Failed to cancel subscription');
            console.error(error);
        }
    };


    if (isLoadingDetails) {
        return <div className="p-4 text-white">Loading account details...</div>;
    }



    return (
        <div className="max-w-4xl mx-auto p-4">
            {accountDetails === 'test user' ? (
                <div className="text-center text-white">
                    <p className="mb-4">This is a test account. Create an account to get started!</p>
                    <button
                        onClick={() => router.push('/SignUp')}
                        className="px-4 py-2 bg-ascent text-white rounded hover:opacity-90 transition-colors"
                    >
                        Create Account
                    </button>
                </div>
            ) : (
                <div className="rounded-lg p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-white text-center">Profile Information</h2>
                        <div className="space-y-2 text-center">
                            <p className="text-white">
                                {accountDetails?.email}
                                {accountDetails?.raw_user_meta_data?.email_verified &&
                                    <span className="ml-2 text-green-500 text-sm">(Verified)</span>
                                }
                            </p>
                            <p className="text-white">
                                {accountDetails?.raw_user_meta_data?.name}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-white text-center">Usage Statistics</h2>
                        <div className="space-y-2 text-center">
                            <p className="text-white">
                                8 total entries created
                            </p>
                            <p className="text-white">
                                8 entries created this month
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-white text-center">Subscription Details</h2>
                        <div className="space-y-2 text-center">
                            <p className="text-white">
                                <span className={accountDetails?.is_subscribed ? 'text-green-600' : 'text-red-500'}>
                                    {accountDetails?.is_subscribed ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                            {accountDetails?.subscription_start && (
                                <p className="text-white">
                                    Started {new Date(accountDetails.subscription_start).toLocaleDateString()}
                                </p>
                            )}
                            {accountDetails?.subscription_end && (
                                <p className="text-white">
                                    You triggered cancellation on {new Date(accountDetails.subscription_end).toLocaleDateString()}
                                </p>
                            )}
                            {accountDetails?.subscription_current_period_end && (
                                <p className="text-white">
                                    Your subscription will expire on {new Date(accountDetails.subscription_current_period_end).toLocaleDateString()}
                                </p>
                            )}
                            {(accountDetails?.subscription_end || !accountDetails?.is_subscribed) && (
                                <button
                                    onClick={() => router.push('/checkout')}
                                    className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Upgrade Account
                                </button>
                            )}
                            {accountDetails?.is_subscribed && !accountDetails?.subscription_end && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                open={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                center
                classNames={{
                    modal: 'rounded-lg p-6 bg-white'
                }}
            >
                <h2 className="text-xl font-bold mb-4">Cancel Subscription</h2>
                <p className="mb-6 text-gray-600">Are you sure you want to cancel your subscription? This action cannot be undone.</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={() => setShowCancelModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        No, Keep It
                    </button>
                    <button
                        onClick={handleCancelClick}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        disabled={isCancelling}
                    >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default WithAuth(AccountDetailsPage);
