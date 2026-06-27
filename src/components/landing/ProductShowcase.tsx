import Image from "next/image";
import Link from "next/link";

const showcases = [
    {
        title: "Citizen Dashboard",
        description:
            "Monitor live civic issues, explore the interactive incident map and track community reports in real time.",
        image: "/screenshots/citizen-dashboard.png",
        href: "/dashboard",
        badge: "Citizen Portal",
    },
    {
        title: "Authority Dashboard",
        description:
            "Prioritize incidents using AI-powered operational insights, live statistics and resolution workflows.",
        image: "/screenshots/authority-dashboard.png",
        href: "/authority",
        badge: "Authority Portal",
    },
    {
        title: "AI Review Workflow",
        description:
            "Review reports, validate evidence and verify repairs with Gemini-assisted decision making.",
        image: "/screenshots/authority-review.png",
        href: "/authority",
        badge: "Gemini AI",
    },
];

export default function ProductShowcase() {
    return (
        <section className="bg-slate-950 py-24">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">

                    <p className="uppercase tracking-[0.3em] text-blue-400 font-semibold">
                        Product Showcase
                    </p>

                    <h2 className="mt-4 text-4xl md:text-5xl font-bold text-white">
                        See Community Hero in Action
                    </h2>

                    <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-400">
                        Community Hero combines AI, community participation and
                        municipal collaboration into one seamless platform for
                        reporting, tracking and resolving civic issues.
                    </p>

                </div>

                <div className="space-y-20">

                    {showcases.map((item, index) => (
                        <div
                            key={item.title}
                            className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                                }`}
                        >

                            <div>

                                <span className="inline-block rounded-full bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-sm text-blue-300">
                                    {item.badge}
                                </span>

                                <h3 className="mt-6 text-3xl font-bold text-white">
                                    {item.title}
                                </h3>

                                <p className="mt-6 text-slate-400 leading-8 text-lg">
                                    {item.description}
                                </p>

                                <Link
                                    href={item.href}
                                    className="inline-flex mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
                                >
                                    Open Page →
                                </Link>

                            </div>

                            <div className="group rounded-3xl overflow-hidden border border-slate-800 shadow-2xl hover:border-blue-500 transition duration-300">

                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={1600}
                                    height={900}
                                    className="w-full group-hover:scale-[1.02] transition duration-500"
                                />

                            </div>

                        </div>
                    ))}

                </div>

            </div>
        </section>
    );
}