'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheckSVG, ExclamationSVG } from '../assets/assets';
import Image from 'next/image';
const VerifyEmail = () => {
    const [message, setMessage] = useState('Verifying your email...');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const verifyEmail = () => {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);

            const access_token = params.get('access_token');
            const type = params.get('type');

            if (type === 'signup' && access_token) {
                try {
                    const tokenParts = access_token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        const currentTime = Math.floor(Date.now() / 1000);

                        if (payload.exp && payload.exp > currentTime) {
                            setMessage('Your email has been successfully verified! Please sign in.');
                            setIsVerified(true);
                        } else {
                            setMessage('Verification failed: Token has expired.');
                        }
                    } else {
                        setMessage('Verification failed: Invalid token format.');
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        setMessage(`Verification failed: ${error.message}`);
                    } else {
                        setMessage('Verification failed: An unknown error occurred.');
                    }
                }
            } else {
                setMessage('Invalid or expired verification link.');
            }
        };

        verifyEmail();
    }, []);

    return (
        <div className=" min-h-screen bg-muted-900">
            <div className="text-center flex items-center justify-center flex-col mt-10">
                {isVerified ? (
                    <Image src={CircleCheckSVG} alt="Verified" width={50} height={50} />
                ) : (
                    <Image src={ExclamationSVG} alt="Failed" width={50} height={50} />
                )}
                <h1 className="text-3xl font-bold text-white mb-4 mt-5">Email Verification</h1>
                <p className="text-lg text-gray-300">{message}</p>
                {isVerified ?
                    <Link href="/login">
                        <button className="bg-ascent mt-3 text-white py-2 px-4 rounded">
                            Sign in
                        </button>
                    </Link> :
                    <Link href="/">
                        <button className="bg-ascent mt-3 text-white py-2 px-4 rounded">
                            Go to Home
                        </button>
                    </Link>
                }

            </div>
        </div>
    );
};

export default VerifyEmail;
