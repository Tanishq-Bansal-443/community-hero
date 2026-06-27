const steps = [
    {
        icon: "📷",
        title: "Upload Photo",
        description:
            "Citizens capture a photo of a civic issue using their phone.",
    },
    {
        icon: "🤖",
        title: "Gemini AI Analysis",
        description:
            "Gemini automatically identifies the issue, severity and generates a structured report.",
    },
    {
        icon: "📍",
        title: "Duplicate Detection",
        description:
            "Nearby reports are merged intelligently to prevent duplicate complaints.",
    },
    {
        icon: "👥",
        title: "Community Validation",
        description:
            "Citizens confirm issues, increasing confidence and helping authorities prioritize.",
    },
    {
        icon: "🏛️",
        title: "Authority Resolution",
        description:
            "Authorities review, update progress and upload repair evidence.",
    },
    {
        icon: "✅",
        title: "AI Repair Verification",
        description:
            "Gemini compares before and after images to verify the repair and detect fraud.",
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 bg-slate-950">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <span className="text-blue-400 font-semibold uppercase tracking-widest">
                        Workflow
                    </span>

                    <h2 className="mt-4 text-4xl md:text-5xl font-bold text-white">
                        How Community Hero Works
                    </h2>

                    <p className="mt-6 text-slate-400 max-w-3xl mx-auto text-lg">
                        Community Hero combines AI, community participation and
                        authority collaboration into one seamless workflow that
                        transforms reporting into verified resolution.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {steps.map((step, index) => (

                        <div
                            key={step.title}
                            className="relative rounded-2xl border border-slate-800 bg-slate-900 p-8 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2"
                        >

                            <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                            </div>

                            <div className="text-5xl mb-6">
                                {step.icon}
                            </div>

                            <h3 className="text-2xl font-semibold text-white">
                                {step.title}
                            </h3>

                            <p className="mt-4 text-slate-400 leading-7">
                                {step.description}
                            </p>

                        </div>

                    ))}

                </div>

            </div>
        </section>
    );
}