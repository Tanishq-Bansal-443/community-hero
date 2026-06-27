import Link from "next/link";

export default function Footer() {
    const technologies = [
        "Gemini AI",
        "Firebase",
        "Firestore",
        "Next.js",
        "TypeScript",
        "Tailwind CSS",
    ];

    return (
        <footer className="border-t border-slate-800 bg-slate-950">
            <div className="max-w-7xl mx-auto px-6 py-16">

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* Left */}

                    <div>

                        <span className="uppercase tracking-[0.35em] text-blue-400 text-sm font-semibold">
                            Community Hero
                        </span>

                        <h2 className="mt-4 text-4xl font-bold text-white">
                            AI-Powered Civic Resolution Platform
                        </h2>

                        <p className="mt-6 text-slate-400 max-w-xl leading-8">
                            Community Hero empowers citizens and municipal
                            authorities to collaboratively identify, validate
                            and resolve civic issues using Gemini AI, community
                            participation and intelligent verification.
                        </p>

                    </div>

                    {/* Right */}

                    <div>

                        <h3 className="text-white font-semibold text-xl mb-6">
                            Built With
                        </h3>

                        <div className="flex flex-wrap gap-3">

                            {technologies.map((tech) => (

                                <span
                                    key={tech}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300"
                                >
                                    {tech}
                                </span>

                            ))}

                        </div>

                        <div className="mt-10 flex flex-wrap gap-4">

                            <Link
                                href="/report"
                                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
                            >
                                Report Issue
                            </Link>

                            <Link
                                href="/dashboard"
                                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800 transition"
                            >
                                Citizen Dashboard
                            </Link>

                            <Link
                                href="/authority"
                                className="rounded-xl border border-emerald-700 text-emerald-400 px-6 py-3 font-semibold hover:bg-emerald-900/20 transition"
                            >
                                Authority Portal
                            </Link>

                        </div>

                    </div>

                </div>

                <div className="mt-16 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-slate-500">

                    <p>
                        Built for the Google Community Hero Hackathon
                    </p>

                    <p>
                        Powered by Gemini AI • Firebase • Next.js
                    </p>

                </div>

            </div>
        </footer>
    );
}