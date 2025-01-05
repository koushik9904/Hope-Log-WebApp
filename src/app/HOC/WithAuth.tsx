import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BounceLoader } from 'react-spinners';
import { toast } from 'react-toastify';

const withAuth = (WrappedComponent: ComponentType) => {
    const ProtectedRoute: React.FC = (props) => {
        const router = useRouter();
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                router.push('/login');
                toast.info('You need to login to access this page');
            } else {
                setIsLoading(false);
            }
        }, [router]);

        if (isLoading) {
            return (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <BounceLoader color="#4A90E2" />
                </div>
            )
        }

        return <WrappedComponent {...props} />;
    };

    return ProtectedRoute;
};

export default withAuth;