export default function HeroPreview() {
    return (
        <div className="relative">

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur p-6 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold">
                            Live Community Dashboard
                        </h3>
                        <p className="text-sm text-slate-400">
                            AI-powered civic monitoring
                        </p>
                    </div>

                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                        ● Live
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">

                    <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-3xl font-bold text-blue-400">128</p>
                        <p className="text-sm text-slate-400">
                            Reports
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-3xl font-bold text-green-400">93</p>
                        <p className="text-sm text-slate-400">
                            Resolved
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-3xl font-bold text-yellow-400">47</p>
                        <p className="text-sm text-slate-400">
                            Citizens
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-3xl font-bold text-purple-400">
                            98%
                        </p>
                        <p className="text-sm text-slate-400">
                            AI Accuracy
                        </p>
                    </div>

                </div>

                {/* AI Workflow */}

                <div className="rounded-xl bg-slate-800 p-5">

                    <h4 className="font-semibold mb-4">
                        AI Resolution Pipeline
                    </h4>

                    <div className="space-y-3">

                        <div className="flex items-center justify-between">
                            <span>📷 Image Uploaded</span>
                            <span className="text-green-400">✓</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span>🤖 Gemini Analysis</span>
                            <span className="text-green-400">✓</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span>📍 Duplicate Detection</span>
                            <span className="text-green-400">✓</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span>👥 Community Validation</span>
                            <span className="text-yellow-400">
                                In Progress
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span>✅ AI Repair Verification</span>
                            <span className="text-slate-500">
                                Pending
                            </span>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}