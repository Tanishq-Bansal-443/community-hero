"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit() {
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
                alert("Logged in");
            } else {
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
                alert("Account created");
            }
        } catch (err: any) {
            alert(err.message);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-sm space-y-4">
                <h1 className="text-3xl font-bold">
                    {isLogin ? "Login" : "Sign Up"}
                </h1>

                <input
                    className="w-full border p-3 rounded"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

                <input
                    type="password"
                    className="w-full border p-3 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button
                    onClick={handleSubmit}
                    className="w-full bg-black text-white p-3 rounded"
                >
                    {isLogin ? "Login" : "Create Account"}
                </button>

                <button
                    onClick={() =>
                        setIsLogin(!isLogin)
                    }
                    className="underline"
                >
                    {isLogin
                        ? "Need an account?"
                        : "Already have an account?"}
                </button>
            </div>
        </main>
    );
}