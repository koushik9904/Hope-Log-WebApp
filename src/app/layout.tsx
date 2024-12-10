import type { Metadata } from "next";
import ClientRootLayout from "./ClientRootLayout";

import "./globals.css";


export const metadata: Metadata = {
  title: "HopeLog",
  description: "Your Buddy For Journaling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-dark">
      <body>
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  );
}
