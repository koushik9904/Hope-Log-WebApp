import Image from 'next/image';
import { HalfShieldSVG, CertificateSVG, LockSolidSVG, KeySolidSVG, UserShieldSVG } from '../assets/assets';
import DisclaimerModal from './DisclaimerModal';
import { useState } from 'react';

const PrivacyAndSecurityLanding = () => {
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const securityFeatures = [
        {
            icon: LockSolidSVG,
            title: "End-to-End Encryption",
            description: "Your journal entries are encrypted before they leave your device, ensuring only you can access them."
        },
        {
            icon: HalfShieldSVG,
            title: "Zero-Knowledge Architecture", 
            description: "We can't read your entries - our systems are designed with zero-knowledge principles."
        },
        {
            icon: KeySolidSVG,
            title: "Secure Authentication",
            description: "Multi-factor authentication and biometric login options keep your account secure."
        }
    ];

    const complianceBadges = [
        { icon: CertificateSVG, text: "SOC 2 Type II" },
        { icon: HalfShieldSVG, text: "GDPR Compliant" },
        { icon: LockSolidSVG, text: "HIPAA Compliant" }
    ];

    const privacyCommitments = [
        "We never sell or share your personal data",
        "Regular third-party security audits",
        "Transparent privacy and data handling",
        "Full data export and deletion options"
    ];

    return (
        <>
            <DisclaimerModal open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
            <div className="min-h-screen text-white py-12 md:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-16 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy & Security First</h1>
                        <p className="text-xl text-gray-300">Your personal thoughts deserve the highest level of protection</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {securityFeatures.map((feature, index) => (
                            <div key={index} className="bg-white rounded-lg p-8 text-center text-slate-800">
                                <div className="flex justify-center mb-4">
                                    <Image
                                        src={feature.icon}
                                        alt={feature.title}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12"
                                    />
                                </div>
                                <h3 className="text-xl text-black font-bold mb-2">{feature.title}</h3>
                                <p className="text-black">{feature.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mb-16">
                        {complianceBadges.map((badge, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 flex items-center gap-2 text-slate-800">
                                <Image
                                    src={badge.icon}
                                    alt={badge.text}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8"
                                />
                                <span className="font-medium text-black">{badge.text}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg p-8 max-w-3xl mx-auto mb-16">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-4 text-slate-800">Our Privacy Commitment</h2>
                                <ul className="space-y-3 text-slate-800">
                                    {privacyCommitments.map((commitment, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {commitment}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                                <Image
                                    src={UserShieldSVG}
                                    alt="Privacy Shield"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowDisclaimer(true)}
                            className="bg-[#3B3B52] text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Read Our Privacy Policy
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default PrivacyAndSecurityLanding;