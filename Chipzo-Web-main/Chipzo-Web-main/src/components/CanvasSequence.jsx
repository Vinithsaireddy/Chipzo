
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
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  )
}
