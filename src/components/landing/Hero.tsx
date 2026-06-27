import Link from "next/link";
import HeroPreview from "./HeroPreview";

export default function Hero() {
    return (
        <section className="relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-emerald-900/20" />

            <div className="relative max-w-7xl mx-auto px-6 py-28 lg:py-36">

                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <div>

                        <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                            🚀 Powered by Gemini AI + Firebase
                        </div>

                        <h1 className="mt-8 text-5xl md:text-7xl font-extrabold leading-tight">
                            AI-Powered
                            <span className="block text-blue-400">
                                Community Issue Resolution
                            </span>
                        </h1>

                        <p className="mt-8 text-lg text-slate-300 leading-8 max-w-2xl">
                            Community Hero helps citizens report civic issues in seconds
                            using AI. From intelligent issue detection to duplicate
                            merging, community validation, and AI-powered repair
                            verification, every step is designed to improve transparency
                            and accelerate resolution.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">

                            <Link
                                href="/report"
                                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
                            >
                                Report an Issue
                            </Link>

                            <Link
                                href="/dashboard"
                                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800 transition"
                            >
                                View Live Map
                            </Link>

                            <Link
                                href="/authority"
                                className="rounded-xl border border-emerald-600 text-emerald-300 px-6 py-3 font-semibold hover:bg-emerald-600/10 transition"
                            >
                                Authority Dashboard
                            </Link>

                        </div>

                        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">

                            <div>
                                <p className="text-3xl font-bold text-blue-400">AI</p>
                                <p className="text-slate-400 mt-1">
                                    Automatic Classification
                                </p>
                            </div>

                            <div>
                                <p className="text-3xl font-bold text-green-400">500m</p>
                                <p className="text-slate-400 mt-1">
                                    Duplicate Detection
                                </p>
                            </div>

                            <div>
                                <p className="text-3xl font-bold text-yellow-400">Live</p>
                                <p className="text-slate-400 mt-1">
                                    Community Validation
                                </p>
                            </div>

                            <div>
                                <p className="text-3xl font-bold text-purple-400">AI</p>
                                <p className="text-slate-400 mt-1">
                                    Repair Verification
                                </p>
                            </div>

                        </div>

                    </div>

                    <HeroPreview />

                </div>

            </div>

        </section>
    );
}