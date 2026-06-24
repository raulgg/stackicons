import {
  getIconAssetPath,
  isIconSlug,
  type IconTheme,
} from "@/lib/icons/registry";
import { cn } from "@/lib/utils";

function getIconThumbnailUrl(slug: string, theme: IconTheme): string {
  return `/icons?s=${encodeURIComponent(slug)}&theme=${theme}`;
}

type IconThumbnailProps = {
  className?: string;
  onError?: () => void;
  slug: string;
};

// Icons with a dark asset render a light/dark <img> pair toggled by the
// `dark:` classes so the thumbnail follows the resolved UI theme without a
// wrong-theme flash — next-themes sets the root class before paint.
export function IconThumbnail({
  className,
  onError,
  slug,
}: IconThumbnailProps) {
  const hasDarkAsset =
    isIconSlug(slug) &&
    getIconAssetPath({ slug, theme: "dark" }) !==
      getIconAssetPath({ slug, theme: "light" });

  if (!hasDarkAsset) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        alt=""
        aria-hidden="true"
        className={className}
        loading="lazy"
        onError={onError}
        src={getIconThumbnailUrl(slug, "light")}
      />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className={cn(className, "dark:hidden")}
        loading="lazy"
        onError={onError}
        src={getIconThumbnailUrl(slug, "light")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className={cn(className, "hidden dark:block")}
        loading="lazy"
        onError={onError}
        src={getIconThumbnailUrl(slug, "dark")}
      />
    </>
  );
}
