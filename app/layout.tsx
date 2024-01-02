import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import "./globals.css";
import { AuthContextProvider } from "./context/AuthContext";
import { TimerProvider } from "./TimerContext";

export const metadata = {
  title: "Devōt | TimeTracker",
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
          <TimerProvider>
            <Navbar />
            {children}
          </TimerProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
