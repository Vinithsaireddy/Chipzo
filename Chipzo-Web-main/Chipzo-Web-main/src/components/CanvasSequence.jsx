
export default function CanvasSequence({ canvasRef }) {
  return (
    <div className="absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      
      {/* Cinematic Overlay Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,color-mix(in_oklch,var(--chipzo-primary)_25%,transparent)_0%,transparent_50%)]" />
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_55%_60%,color-mix(in_oklch,var(--chipzo-lime)_15%,transparent)_0%,transparent_40%)]" 
      />
      
      {/* Subtle Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;)]" />
    </div>
  )
}
