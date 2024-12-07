import type { Metadata } from "next";
import Header from "./layout/Header/Header";
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
      <Header />
        {children}
      </body>
    </html>
  );
}
