// ClientRootLayout.tsx
'use client';

import { QueryClient, QueryClientProvider } from "react-query";
import { useState } from "react";
import Header from "./layout/Header/Header";

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
    </QueryClientProvider>
  );
}
