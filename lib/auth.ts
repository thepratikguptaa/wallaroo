/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./db";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "email" },
                password: {
                    label: "Password",
                    type: "password",
                    placeholder: "password",
                },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter email and password");
                }

                try {
                    await connectToDatabase();

                    const user = await UserModel.findOne({
                        email: credentials.email,
                    });
                    if (!user) {
                        throw new Error("User not found");
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );
                    if (!isValid) {
                        throw new Error("Invalid password");
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Auth error: ", error);
                    throw error;
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },

        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.role = token.role as string;

            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },

    secret: process.env.NEXTAUTH_SECRET,
};
