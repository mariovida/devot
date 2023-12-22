import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import "./globals.css";
import { AuthContextProvider } from "./context/AuthContext";

export const metadata = {
  title: "Devōt",
  description: "Time tracking software",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="favicon.svg" />
      </head>
      <body>
      <AuthContextProvider>
        <Navbar />
        {children}
        </AuthContextProvider>
      </body>
    </html>
  );
}
