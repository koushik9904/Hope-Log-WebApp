'use client';
import { QueryClient, QueryClientProvider } from "react-query";
import { useState } from "react";
import Header from "./layout/Header/Header";
import { ToastContainer } from 'react-toastify';

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      {children}
      <ToastContainer position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </QueryClientProvider>
  );
}
