export default function Loading() {
  const color = "var(--brand-primary, hsl(var(--primary)))";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf7ee] gap-6 px-6 font-sans">
      <p
        className="font-display italic text-3xl md:text-4xl"
        style={{ color }}
      >
        compondo a cena
        <span className="animate-pulse">…</span>
      </p>
      <div className="flex gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: color, animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: color, animationDelay: "200ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: color, animationDelay: "400ms" }}
        />
      </div>
    </div>
  );
}
