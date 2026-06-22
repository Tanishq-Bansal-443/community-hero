import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="border-b px-6 py-4 flex items-center justify-between">
            <h1 className="font-bold text-xl">
                Community Hero
            </h1>

            <div className="flex gap-6">
                <Link href="/">Home</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/report">Report Issue</Link>
                <Link href="/auth">Auth</Link>
            </div>
        </nav>
    );
}