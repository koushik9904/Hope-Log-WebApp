'use client';
import Image from 'next/image';
import { ChatHeroPNG, EntriesHeroPNG } from "../assets/assets";
import { Link as ScrollLink } from 'react-scroll';
import { useAuth } from '../hooks/useAuth';
import { BounceLoader } from 'react-spinners';
import { Tooltip } from 'react-tooltip';

export default function HeroLanding() {
    const { handleLogin, loginIsLoading } = useAuth();

    const handleAutoLogin = async () => {
        await handleLogin(
            'riloho4189@fundapk.com',
            'test12345'
        );
    };

    return (
        <>
            {loginIsLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <BounceLoader color="#ffffff" />
                    <p className="mt-4">Redirecting...</p>
                </div>
            )}
            <div id="hero-landing" className="relative text-white overflow-hidden min-h-screen flex mt-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-10 p-4">
                            <div className="space-y-8">
                                <h1 className="text-4xl text-center md:text-left md:text-5xl lg:text-6xl">
                                    Transform Your Thoughts with{' '}
                                    <span className="font-medium">AI-Powered</span>{' '}
                                    <span className="block mt-2">Journaling</span>
                                </h1>
                                <p className="text-lg md:text-xl text-gray-300 text-center md:text-left">
                                    Write freely while our AI helps you gain deeper insights, track patterns and achieve personal growth through intelligent analysis.
                                </p>
                                <div className="flex flex-col lg:flex-row gap-4 md:items-center justify-center md:justify-start">
                                    <button
                                        onClick={handleAutoLogin}
                                        className="px-8 py-3 bg-[#4285F4] hover:bg-[#3b77db] rounded-lg text-white font-medium transition-colors"
                                        data-tooltip-id="demo-tooltip"
                                    >
                                        Start Journaling Free
                                    </button>
                                    <Tooltip id="demo-tooltip" place="top-end" content="Experience our journaling app instantly with a demo account" />
                                    <ScrollLink
                                        to="how-journaling-works"
                                        smooth={true}
                                        duration={500}
                                        className="px-8 py-3 bg-[#A3C9FF] hover:bg-[#92b8ee] rounded-lg text-white font-medium transition-colors text-center cursor-pointer"
                                    >
                                        Learn More
                                    </ScrollLink>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Image
                                        src={ChatHeroPNG}
                                        alt="AI Chat Interface"
                                        className="object-contain rounded-lg"
                                        priority
                                    />
                                </div>
                                <div>
                                    <Image
                                        src={EntriesHeroPNG}
                                        alt="Journal Entries Interface"
                                        className="object-contain rounded-lg"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}