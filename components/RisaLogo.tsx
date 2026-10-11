import Image from "next/image";

type RisaLogoProps = {
  className?: string;
  compact?: boolean;
  tone?: "light" | "dark";
};

export default function RisaLogo({ className = "", compact = false, tone = "light" }: RisaLogoProps) {
  return (
    <div className={`inline-flex min-w-0 items-center justify-center ${className}`} role="img" aria-label="RISA Verify, clinical intelligence">
      <Image
        src="/risa-logo-primary.png"
        alt="RISA Verify"
        width={compact ? 280 : 740}
        height={compact ? 110 : 260}
        priority
        className={compact ? "h-12 w-auto max-w-[220px] object-contain" : "h-auto w-full max-w-[440px] object-contain"}
      />
    </div>
  );
}
