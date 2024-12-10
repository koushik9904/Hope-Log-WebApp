import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ComponentType } from 'react';
import { useQuery } from 'react-query';
import {fetchUser} from '../apis';

const ProtectedRoute = (WrappedComponent: ComponentType) => {
    return (props: any) => {
        const router = useRouter();
        const { data: isAuthenticated, isLoading } = useQuery('authStatus', fetchUser);

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/login');
            }
        }, [isLoading, isAuthenticated]);

        if (isLoading) {
            return <div>Loading...</div>; 
        }

        return <WrappedComponent {...props} />;
    };
};

export default ProtectedRoute;
