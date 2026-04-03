import { StainedGlassOverlay } from "@/shared/components/ui/StainedGlass";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: "linear-gradient(135deg, #2d1f14, #3d2b1f)" }}
    >
      <StainedGlassOverlay opacity={0.06} />
      {/* Arch */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 110,
          border: "1px solid rgba(201, 149, 96, 0.08)",
          borderRadius: "50% 50% 0 0",
          borderBottom: "none",
        }}
      />
      <div className="relative w-full max-w-[300px]">
        {/* Logo */}
        <div className="mb-5 text-center">
          <h1 className="font-serif text-[28px] font-semibold" style={{ color: "#c99560" }}>
            ✦ Liturgix
          </h1>
          <p className="mt-1 text-[11px] tracking-[2px]" style={{ color: "#7a5c3a" }}>
            ESCALAS LITÚRGICAS
          </p>
          <p
            className="mt-2.5 font-serif text-xs italic"
            style={{ color: "rgba(154, 133, 104, 0.38)" }}
          >
            "Servi ao Senhor com alegria" — Sl 100,2
          </p>
        </div>
        {/* Card */}
        <div
          className="rounded-xl p-[22px]"
          style={{
            background: "#4a3628",
            border: "1px solid #5a4636",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
