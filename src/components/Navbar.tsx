"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
export default function Navbar() {
    const { user } = useAuth();
    const router = useRouter();

    async function handleLogout() {
        await signOut(auth);
        router.refresh();
    }
    return (
        <nav className="border-b px-6 py-4 flex items-center justify-between">
            <h1 className="font-bold text-xl">
                Community Hero
            </h1>

            <div className="flex items-center gap-6">
                <Link href="/">Home</Link>

                <Link href="/dashboard">Map</Link>

                <Link href="/report">Report Issue</Link>

                <Link href="/authority/dashboard">
                    Authority
                </Link>

                {user ? (
                    <>
                        <span className="text-sm text-gray-400">
                            {user.email}
                        </span>

                        <button
                            onClick={handleLogout}
                            className="text-red-500 hover:underline"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <Link href="/auth">Login</Link>
                )}
            </div>
        </nav>
    );
}