import Image from "next/image";

type RisaLogoProps = {
  className?: string;
  compact?: boolean;
  tone?: "light" | "dark";
};

export default function RisaLogo({ className = "", compact = false, tone = "light" }: RisaLogoProps) {
  const textTone = tone === "light" ? "text-white" : "text-[#0B1B31]";
  const detailTone = tone === "light" ? "text-white/70" : "text-[#087F9B]";

  return (
    <div className={`inline-flex min-w-0 items-center gap-2.5 ${className}`} role="img" aria-label="RISA Verify, clinical intelligence">
      <Image src="/risa-mark.svg" alt="" width={52} height={52} priority className="h-11 w-11 shrink-0" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`text-[17px] font-extrabold tracking-[0.08em] ${textTone}`}>RISA</span>
        <span className={`mt-0.5 text-[10px] font-bold tracking-[0.2em] ${detailTone}`}>VERIFY</span>
        {!compact && <span className={`mt-1.5 text-[7px] font-semibold tracking-[0.12em] ${tone === "light" ? "text-white/45" : "text-[#64748b]"}`}>CLINICAL INTELLIGENCE</span>}
      </span>
    </div>
  );
}
