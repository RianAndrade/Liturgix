interface StainedGlassOverlayProps {
  opacity?: number;
}

export function StainedGlassOverlay({ opacity = 0.04 }: StainedGlassOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        background: [
          "radial-gradient(ellipse at 30% 20%, #8b1a1a 0%, transparent 50%)",
          "radial-gradient(ellipse at 70% 50%, #3d5a6e 0%, transparent 50%)",
          "radial-gradient(ellipse at 40% 80%, #c99560 0%, transparent 50%)",
        ].join(", "),
      }}
    />
  );
}

export function VitralBorder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${className}`}
      style={{
        background: "linear-gradient(180deg, #8b1a1a, #c99560, #5c6b4e, #3d5a6e, #6e3044)",
      }}
    />
  );
}
