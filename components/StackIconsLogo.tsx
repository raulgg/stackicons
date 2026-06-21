import Image from "next/image";

import stackIconsLogo from "@/assets/stack-icons-logo.svg";

type StackIconsLogoProps = {
  className?: string;
  size?: number;
};

export function StackIconsLogo({ className, size = 52 }: StackIconsLogoProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={size}
      src={stackIconsLogo}
      width={size}
    />
  );
}
