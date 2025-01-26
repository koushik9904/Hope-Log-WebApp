'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface PricingFeature {
    text: string;
}

interface PricingTier {
    name: string;
    price?: string;
    description: string;
    features: PricingFeature[];
    buttonText: string;
    isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
    {
        name: 'Basic',
        price: 'Free',
        description: 'Perfect for getting started',
        features: [
            { text: '5 journal entries per month' },
            { text: 'Basic AI Insights' },
            { text: 'Mobile app access' },
        ],
        buttonText: 'Get Started',
    },
    {
        name: 'Pro',
        price: '$4.99',
        description: 'For dedicated Journalers',
        features: [
            { text: 'Unlimited journel entries' },
            { text: 'Advanced AI analysis' },
            { text: 'Custom prompts' },
            { text: 'Mood tracking' },
            { text: 'Priority Support' },
        ],
        buttonText: 'Get Started',
        isPopular: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For teams and organizations',
        features: [
            { text: 'Everything in Pro' },
            { text: 'Team management' },
            { text: 'API access' },
            { text: 'Custom Integrations' },
        ],
        buttonText: 'Contact Sales',
    },
];

const faqs = [
    {
        question: 'Can I switch plans anytime?',
        answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
        question: 'Is my data Secure?',
        answer: 'Absolutely. We use end-to-end encryption to ensure your journal entries remain private and secure',
    },
    {
        question: 'Do you offer refunds?',
        answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.",
    },
];

export default function PricingLanding() {
    return (
        <div className="w-full py-16 px-16 sm:px-16 lg:px-16" id="pricing-landing">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-xl text-gray-300">Choose the perfect plan for your journaling journey</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {pricingTiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`rounded-lg bg-white p-8 shadow-lg relative ${tier.isPopular ? 'ring-2 ring-black' : ''
                                }`}
                        >
                            {tier.isPopular && (
                                <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-[#333333] text-white px-3 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </span>
                            )}
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                                <div className="mt-4 flex items-baseline justify-center gap-x-2">
                                    {tier.price === 'Free' ? (
                                        <span className="text-5xl font-bold tracking-tight text-gray-900">Free</span>
                                    ) : tier.price === 'Custom' ? (
                                        <span className="text-5xl font-bold tracking-tight text-gray-900">Custom</span>
                                    ) : (
                                        <>
                                            <span className="text-5xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                                            <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">/month</span>
                                        </>
                                    )}
                                </div>
                                <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
                            </div>

                            <ul className="mt-8 space-y-4">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckIcon className="h-6 w-6 flex-shrink-0 text-black" />
                                        <span className="ml-3 text-sm text-gray-600">{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`mt-8 w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm ${tier.isPopular
                                    ? 'bg-[#3B3B52] text-white hover:bg-[#2d2d3f]'
                                    : 'bg-white text-[#3B3B52] ring-1 ring-inset ring-[#3B3B52] hover:bg-gray-50'
                                    }`}
                            >
                                {tier.buttonText}
                            </button>
                        </div>
                    ))}
                </div>


                <div className="w-full">
                    <h3 className="text-3xl font-bold text-white text-center mb-8">Pricing FAQ</h3>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h4>
                                <p className="text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
