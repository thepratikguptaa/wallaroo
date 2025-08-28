"use client";

import { SessionProvider } from "next-auth/react";
import { IKContext } from "imagekitio-react";
import { NotificationProvider } from "@/app/components/Notification";

const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT!;
const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY!;

export default function Providers({ children }: { children: React.ReactNode }) {
    const authenticator = async () => {
        try {
            const res = await fetch("/api/imagekit-auth");
            if (!res.ok) throw new Error("Failed to authenticate");
            return res.json();
        } catch (error) {
            console.error("ImageKit authentication error:", error);
            throw error;
        }
    };

    return (
        <SessionProvider refetchInterval={5 * 60}>
            <NotificationProvider>
                <IKContext
                    publicKey={publicKey}
                    urlEndpoint={urlEndpoint}
                    authenticator={authenticator}
                >
                    {children}
                </IKContext>
            </NotificationProvider>
        </SessionProvider>
    );
}
