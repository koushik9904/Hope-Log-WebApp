'use client'
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CircleCheckSVG } from '../assets/assets';

export default function SignupVerification() {
    const router = useRouter();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                        <div className="space-y-6 text-center flex flex-col justify-center items-center">
                            <Image src={CircleCheckSVG} alt="Circle Check" width={50} height={50} />
                            <h1 className="text-2xl mb-5">Signup Successful!</h1>
                            <p className="text-sm/6 font-medium text-gray-900">
                                Thank you for signing up. Please check your email to verify your signup details.
                            </p>
                            <p className="text-sm/6 font-medium text-gray-900">
                                Returning you to the home page...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
