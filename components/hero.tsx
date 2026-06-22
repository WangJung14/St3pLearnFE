export default function Hero() {
  return (
    <div className="min-h-screen w-full relative bg-white overflow-hidden">
      {/* Teal Glow Left */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#ffffff",
          backgroundImage: `
            radial-gradient(
              circle at top left,
              rgba(56, 193, 182, 0.5),
              transparent 70%
            )
          `,
          filter: "blur(80px)",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content Section */}
      <section className="relative z-10 grid md:grid-cols-2 gap-16 items-center px-16 py-16">
        {/* Content */}
        <div className="space-y-8">
          <h1 className="font-display-lg text-display-lg text-on-surface">
            Learn practical skills from industry experts.
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Accelerate your career with world-class certifications, hands-on
            projects, and expert-led curriculum designed for modern
            professionals.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="font-label-md text-label-md bg-primary text-on-primary px-8 py-4 rounded-lg shadow-soft hover:shadow-hover transition-all cursor-pointer">
              Explore Courses
            </button>
            <button className="font-label-md text-label-md border border-outline text-secondary px-8 py-4 rounded-lg hover:bg-surface-container-low transition-all cursor-pointer">
              Become an Instructor
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative w-full h-[500px] bg-white rounded-xl shadow-soft border border-outline-variant p-6 hidden md:block">
          <div
            className="w-full h-full bg-cover bg-center rounded-lg border border-surface-container"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFFnwM3X-UwHWS2lZBiLfhsXijJSGMj9hTpP0oj-WxfYDpyK8acIOaSbfOrlhJaqRLBAMkIl7VY878KChmaOA66iAKNgeSppm4nGKvwnUmbZxrtA7LJK_onm69f-Zct1BPV-2Vl_XlLVM8bucSmd8of5bUrJqi-51FdrOtxJtqhn7rmeLOFXKtdmxiwcC-wwP3jr9_g9Ne0UzqcUiUdxPBM6MUUdcQ3LWAPlRnmXFmUepUU5FWcSzLvDfIP_xIcMsWu8JYm7r6Wf4i')",
            }}
          />
        </div>
      </section>
    </div>
  );
}
