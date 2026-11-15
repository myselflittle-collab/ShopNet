"use client";

import { useState } from "react";
import type { ProductPhoto } from "@/lib/catalog/types";
import { photoUrl } from "@/lib/catalog/photos";

/**
 * A product photograph in the shop's 4:5 frame, served at the right size for the screen.
 * If the image can't load (offline, blocked host) it shows a quiet labelled frame instead of a broken icon.
 */
export function Photo({
  photo,
  width = 600,
  sizes = "(max-width: 768px) 50vw, 25vw",
  className = "",
  priority = false,
}: {
  photo: ProductPhoto;
  width?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`grid aspect-[4/5] w-full place-items-center bg-[#efebe4] p-4 text-center ${className}`} role="img" aria-label={photo.alt}>
        <span className="text-[11px] leading-tight text-muted">Photo unavailable</span>
      </div>
    );
  }
  const srcSet = [Math.round(width / 2), width, width * 2].map((w) => `${photoUrl(photo, w)} ${w}w`).join(", ");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl(photo, width)}
      srcSet={srcSet}
      sizes={sizes}
      alt={photo.alt}
      width={width}
      height={Math.round(width * 1.25)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`aspect-[4/5] w-full bg-[#efebe4] object-cover ${className}`}
    />
  );
}
