import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { Link as ScrollLink } from 'react-scroll';


interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "How does AI enhance my journaling experience?",
        answer: "Our AI analyzes your journal entries to identify emotional patterns, recurring themes, and personal growth opportunities. It provides personalized insights, writing prompts, and tracks your progress over time, helping you develop deeper self-awareness"
    },
    {
        question: "Is my journal data private and secure?",
        answer: "Absolutely. We use end-to-end encryption to ensure your journal entries remain completely private. Our security measures exceed industry standards, and we never share your personal data with third parties."
    },
    {
        question: "Can I export my journal entries?",
        answer: "Yes, you can export your journal entries in multiple formats (PDF, TXT, or DOC). All your data belongs to you, and you can download it anytime from your account settings."
    },
    {
        question: "What devices can I use JournalAI on?",
        answer: "JournalAI works on all modern devices through our web app. We also offer native apps for iOS and Android, with automatic sync across all your devices."
    },
    {
        question: "What happens if I exceed my plan's limits?",
        answer: "You'll receive a notification when you're approaching your plan's limits. You can either upgrade your plan or continue with limited features until the next billing cycle."
    }
];

const FrequentlyAskedQuestions = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full min-h-screen py-16 px-16 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
                    Frequently Asked Questions
                </h2>
                <p className="text-gray-300 text-center mb-12">
                    Everything you need to know about JournalAI
                </p>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg overflow-hidden"
                        >
                            <button
                                className="w-full px-6 py-4 flex justify-between items-center text-left"
                                onClick={() => toggleFAQ(index)}
                            >
                                <span className="font-medium text-gray-900">{faq.question}</span>
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openIndex === index ? 'transform rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {openIndex === index && (
                                <div className="px-6 pb-4">
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <h3 className="text-2xl font-semibold text-white mb-4">
                        Still have questions?
                    </h3>
                    <p className="text-gray-300 mb-6">
                        We're here to help you get the most out of your journaling practice
                    </p>
                    <ScrollLink
                        to="contact-me"
                        smooth={true}
                        duration={500}
                        className="inline-flex items-center px-6 py-3 bg-[#3B3B52] hover:bg-[#2d2d3f] text-white font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                        Contact Support
                    </ScrollLink>
                </div>
            </div>
        </div>
    );
};

export default FrequentlyAskedQuestions;
