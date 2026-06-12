// src/components/auth/AuthLeftPanel.tsx
export default function AuthLeftPanel() {
    return (
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    className="w-full h-full object-cover opacity-60"
                    data-alt="A serene and majestic interior view of a historic cathedral in Kampala, featuring high arched ceilings and soft sunlight streaming through stained glass windows. The atmosphere is quiet and reverent, conveying a sense of spiritual peace and communal stewardship. The lighting is ethereal and warm, highlighting the intricate architectural details with a soft glow, aligning with a professional and compassionate organizational aesthetic."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZF9Kre0nW8abz3PdEQVrKJLiV-VtLm2PI9sMX8Cv8bmasDtM2vEwtrh7SLPDf9gW7xEqxXWtz-V11mUq31jb53cRstA-KqG_vw-TVOqt25728PAD-MO6QCsmWWV3zcHYqqL7n_inBKBH8il5yzQJMaHNbpN9V6trZFYt70svURzY3N1Px4Zl9aF3BFOnRqLeEBPnLJniVaxvED34Lx075r8jxUiJLCoToA3OyxXCEna6npl8SXHaS_QCGNZc3Sb9KYCmWQXefL40"
                />
            </div>
            {/* <!-- Mission Overlay --> */}
            <div className="relative z-10 p-unit-12 max-w-xl text-on-primary">
                <div
                    className="mb-unit-8 fade-in"
                    style={{ animationDelay: "0.2s" }}
                >
                    <div className="flex items-center gap-unit-2 mb-unit-4">
                        <span
                            className="material-symbols-outlined text-secondary-fixed text-4xl"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                        >
                            balance
                        </span>
                        <span className="font-headline-md text-headline-md border-l-2 border-secondary-fixed pl-unit-4 tracking-tight">
                            GSPM Digital
                        </span>
                    </div>
                    <h1 className="font-headline-xl text-headline-xl mb-unit-6 leading-tight">
                        Fostering Hope through Service.
                    </h1>
                    <p className="font-body-lg text-body-lg text-primary-fixed opacity-90 leading-relaxed italic">
                        "Serving the Good Samaritans and Prisons Ministry across
                        the Kampala Archdiocese."
                    </p>
                </div>
                <div
                    className="glass-overlay p-unit-6 rounded-lg fade-in"
                    style={{ animationDelay: "0.4s" }}
                >
                    <div className="flex items-start gap-unit-4">
                        <span className="material-symbols-outlined text-secondary-container mt-1">
                            verified_user
                        </span>
                        <div>
                            <h3 className="font-label-md text-label-md uppercase tracking-widest text-secondary-container mb-unit-1">
                                Secure Operations
                            </h3>
                            <p className="font-label-md text-label-md opacity-80">
                                Managing administrative and pastoral duties with
                                institutional excellence and digital security.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* <!-- Subtle Texture Over --> */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage:
                        "radial-gradient(#ffffff 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            ></div>
        </div>
    );
}
