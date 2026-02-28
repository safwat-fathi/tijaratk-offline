'use client';

import Image from 'next/image';
import { ReactNode, useMemo, useState } from 'react';

type SafeImageProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  fallback: ReactNode;
  containerClassName?: string;
  imageClassName?: string;
  unoptimized?: boolean;
  priority?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
};

export default function SafeImage({
  src,
  alt,
  width,
  height,
  fallback,
  containerClassName,
  imageClassName,
  unoptimized,
  priority,
  sizes,
  loading,
}: SafeImageProps) {
  const normalizedSrc = useMemo(() => {
    const trimmedSrc = src?.trim();
    return trimmedSrc ? trimmedSrc : null;
  }, [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = normalizedSrc !== null && failedSrc === normalizedSrc;

  if (!normalizedSrc || hasError) {
    if (containerClassName) {
      return (
        <div className={containerClassName}>
          <span className="sr-only">{alt}</span>
          {fallback}
        </div>
      );
    }

    return (
      <>
        <span className="sr-only">{alt}</span>
        {fallback}
      </>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={imageClassName}
      unoptimized={unoptimized}
      priority={priority}
      sizes={sizes}
      loading={loading}
      onError={() => setFailedSrc(normalizedSrc)}
    />
  );
}
