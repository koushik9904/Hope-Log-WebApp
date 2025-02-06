import * as React from 'react';
import Image from 'next/image';
import {
    BrainSolidSVG as BrainIcon,
    ChartLineSolidSVG as ChartIcon,
    LightBulbSolidSVG as LightBulbIcon,
    LockSolidSVG as LockIcon,
    MobileSolidSVG as MobileIcon,
    WandMagicSolidSVG as WandIcon
} from "../assets/assets";

interface Feature {
    icon: string;
    title: string;
    description: string;
}

const JournalingOverview = () => {
    const features: Feature[] = [
        {
            icon: BrainIcon,
            title: "AI-Powered Insights",
            description: "Get personalized analysis of your mood patterns, emotional trends, and writing style"
        },
        {
            icon: LockIcon,
            title: "Private & Secure",
            description: "End-to-end encryption ensures your thoughts remain completely private and secure."
        },
        {
            icon: ChartIcon,
            title: "Progress Tracking",
            description: "Visualize your personal growth with intuitive charts and progress indicators"
        },
        {
            icon: LightBulbIcon,
            title: "Smart Prompts",
            description: "Never face writer's block with AI-generated prompts tailored to your journaling style"
        },
        {
            icon: MobileIcon,
            title: "Cross-Platform Sync",
            description: "Access your journal from any device with seamless synchronization."
        },
        {
            icon: WandIcon,
            title: "Theme Analysis",
            description: "Discover recurring themes and patterns in writing with AI-powered analysis."
        }
    ];

    return (
        <div className="container mx-auto px-5 py-12" id="features-landing">
            <div className="text-center mb-3">
                <h2 className="text-6xl font-bold mb-4">Powerful Features for Mindful <br></br> Journaling</h2>
                <p className="text-xl text-white">
                    Experience the perfect blend of traditional journaling and AI-powered insights
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-24 mt-12">
                {features.map((feature, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 md:p-8 shadow-lg flex flex-col items-center text-center mx-4 md:mx-0">
                        <div className="mb-4">
                            <Image
                                src={feature.icon}
                                alt={feature.title}
                                width={48}
                                height={48}
                            />
                        </div>
                        <h3 className="text-xl text-black font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalingOverview;

