import Image from "next/image";

export default function Logo({ size = 44 }: { size?: number }) {
  const pad = Math.max(3, Math.round(size * 0.12));
  const imgSize = size - pad * 2;

  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0 rounded-full bg-night"
      style={{ width: size, height: size }}
    >
      <Image src="/logo-mark.png" alt="Smart Tech" width={imgSize} height={imgSize} priority />
    </span>
  );
}
