import Image from "next/image";

export function BrandMark({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${className}`}
      height={size}
      priority={priority}
      src="/brand/mecania-logo.png"
      width={size}
    />
  );
}
