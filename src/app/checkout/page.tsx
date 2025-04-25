'use client';

import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import withAuth from '../HOC/WithAuth';
import { useCheckout } from '../hooks/useCheckout';
import { BounceLoader } from 'react-spinners';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const { handleCardDetails, isLoading, error, resetError } = useCheckout();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetError();

        if (!stripe || !elements) {
            return;
        }

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                console.error('Submit error:', submitError);
                return;
            }

            const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
                elements
            });

            if (paymentMethodError) {
                console.error('Payment method error:', paymentMethodError);
                return;
            }

            if (!paymentMethod?.id) {
                console.error('Payment method ID not found');
                return;
            }

            handleCardDetails(paymentMethod.id);
        } catch (err) {
            console.error('Payment processing error:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 relative">
            <PaymentElement />

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 rounded">
                    <BounceLoader color="#ffffff" />
                    <p className="text-white mt-4">Processing payment...</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isLoading}
                className={`mt-8 w-full bg-ascent text-white rounded-md px-4 py-2  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${(!stripe || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                Subscribe Now
            </button>
        </form>
    );
};

const CheckoutPage = () => {
    const { clientSecret, isLoading } = useCheckout();

    if (isLoading || !clientSecret) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const options: StripeElementsOptions = {
        clientSecret,
        appearance: {
            theme: 'stripe' as const,
        },
        paymentMethodCreation: 'manual'
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Pro Subscription Plan
                    </h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Monthly subscription</span>
                            <span className="text-2xl font-bold">$4.99</span>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold mb-2">Features included:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Unlimited AI conversations
                                </li>
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Priority support
                                </li>
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Advanced features
                                </li>
                            </ul>
                        </div>
                    </div>

                    <Elements stripe={stripePromise} options={options}>
                        <CheckoutForm />
                    </Elements>
                </div>
            </div>
        </div>
    );
};

export default withAuth(CheckoutPage);