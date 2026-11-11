import { parseImageSizes } from '@evershop/evershop/lib/util/parseImageSizes';
import React, { useEffect, useRef, useState } from 'react';
import { useIsInPageBuilderIframe } from './page-builder/pageBuilderMode.js';
import './Loading.scss';

/** 1x1 transparent GIF — stands in for an image that has not arrived yet. */
const BLANK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const SKELETON_CLASS = 'evershop-image-skeleton';

export type ImageProps = {
  src: string;
  width: number; // Intrinsic width of the image
  height: number; // Intrinsic height of the image
  alt: string;
  quality?: number;
  unoptimized?: boolean;
  priority?: boolean;
  sizes?: string;
  loading?: 'eager' | 'lazy' | undefined;
  decoding?: 'async' | 'auto' | 'sync' | undefined;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | 'unset';
  // `style` was already declared rather than inherited from the intersection
  // below because `react/prop-types` cannot see through it. The three that
  // follow are read off `props` for the same reason.
  style?: React.CSSProperties;
  className?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
} & React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Builds the `/images` proxy srcset for an image with a known intrinsic
 * `width`. Exported so art-directed `<picture>` `<source>` elements (e.g.
 * the slideshow's mobile variant) can serve the same resized candidates as
 * the `<Image>` component itself.
 */
export function buildImageSrcSet(
  src: string,
  width: number,
  sizes = '100vw',
  quality = 75
): string {
  const imageSizes = parseImageSizes(sizes);
  // Don't upscale beyond 3 times the original width, but be smarter about filtering
  let filteredSizes = imageSizes.filter((size) => size <= width * 3);

  if (filteredSizes.length < 2) {
    // Add the original width
    filteredSizes.push(width);

    const smallerSizes = [
      Math.round(width * 0.5), // 50% of original
      Math.round(width * 0.75) // 75% of original
    ].filter((size) => size >= 200 && !filteredSizes.includes(size)); // Don't go too small

    filteredSizes = [...filteredSizes, ...smallerSizes];
  }

  if (!filteredSizes.includes(width)) {
    filteredSizes.push(width);
  }

  filteredSizes = [...new Set(filteredSizes)].sort((a, b) => a - b);

  return filteredSizes
    .map((size) => {
      // Construct the URL pointing to our image API
      const url = `/images?src=${encodeURIComponent(
        src
      )}&w=${size}&q=${quality}`;
      return `${url} ${size}w`;
    })
    .join(', ');
}

export function Image({
  src,
  width,
  height,
  alt,
  quality = 75,
  unoptimized = false,
  loading = 'eager',
  decoding = 'async',
  priority = false,
  sizes = '100vw',
  // `cover` by default: the box is pinned to the intrinsic `width`/`height` (the
  // catalog image dimensions for product photos), so a photo of another ratio
  // must be cropped, never stretched. Pass `contain`/`scale-down` where the whole
  // image matters (the gallery does).
  objectFit = 'cover',
  ...props
}: ImageProps): React.ReactElement | null {
  const srcset = unoptimized
    ? undefined
    : buildImageSrcSet(src, width, sizes, quality);
  const fallbackSrc = unoptimized
    ? src
    : `/images?src=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

  // Page-builder only: hold a skeleton at the NEW image's dimensions instead of
  // the previous image, for the window where the box is sized but has no bytes.
  //
  // The browser never requests `src` itself — it requests a PROCESSED variant
  // (`/images?src=…&w=…&q=…`), which `imageProcessor` builds on the first
  // request and then caches to disk. For cloud storage that first request
  // downloads the original server-side and runs sharp before a single byte
  // comes back: ~4.4s measured for a 1MB S3 original, against ~0.2s once
  // cached. Right after a merchant picks a new image every variant is cold.
  //
  // An <img> keeps painting its previous bitmap until the new one decodes, and
  // an element cannot hide its own bitmap while still showing its own
  // background — so a skeleton on the element alone would just pulse the stale
  // image, which reads as a rendering fault rather than as loading. While the
  // replacement is in flight the element therefore carries a blank pixel, and
  // `srcSet` is dropped (it outranks `src`, so leaving it would defeat this).
  // `width`/`height`/`aspectRatio` already describe the incoming image, so the
  // skeleton holds its shape and the swap does not reflow.
  //
  const inPageBuilder = useIsInPageBuilderIframe();
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // The variant whose bytes are safe to paint. Seeded to the first render's
  // own URL so nothing is blanked on mount — only a LATER change to `src`
  // opens a gap, which is exactly the case this is for.
  const [confirmedSrc, setConfirmedSrc] = useState(fallbackSrc);
  const awaitingSwap = inPageBuilder && confirmedSrc !== fallbackSrc;

  const shownSrc = awaitingSwap ? BLANK_PIXEL : fallbackSrc;
  const shownSrcSet = awaitingSwap ? undefined : srcset;

  useEffect(() => {
    // Outside the builder, track `src` so a change never renders the blank
    // pixel even for one frame.
    if (!inPageBuilder) {
      setConfirmedSrc(fallbackSrc);
      return undefined;
    }
    if (confirmedSrc === fallbackSrc) {
      return undefined;
    }
    // Warm the replacement off-DOM, mirroring `srcset`/`sizes` so the browser
    // picks and caches the same candidate the element will ask for.
    let cancelled = false;
    const preload = new window.Image();
    const settle = () => {
      if (!cancelled) setConfirmedSrc(fallbackSrc);
    };
    preload.onload = settle;
    // A broken replacement must still release the slot, or the skeleton would
    // run forever on a 404.
    preload.onerror = settle;
    preload.sizes = sizes;
    if (srcset) preload.srcset = srcset;
    preload.src = fallbackSrc;
    return () => {
      cancelled = true;
    };
  }, [inPageBuilder, fallbackSrc, srcset, sizes, confirmedSrc]);

  useEffect(() => {
    const img = imgRef.current;
    // `complete` covers the load that finished before React attached `onLoad`.
    // SSR'd markup starts fetching during HTML parse, well before hydration,
    // and `inPageBuilder` only flips true in a post-mount effect — so by the
    // time the skeleton could apply, the event has often already fired. It is
    // also true for a load that errored, which must clear the skeleton too.
    // Without reading it here the skeleton would stick forever.
    setLoaded(img ? img.complete : false);
  }, [shownSrc, inPageBuilder]);

  // `awaitingSwap` has to hold the skeleton on its own: the blank pixel
  // "loads" instantly, so `loaded` goes true while the real bytes are still
  // in flight.
  const showSkeleton = awaitingSwap || !loaded;

  // Both handlers pass through to a caller-supplied one, since the explicit
  // attribute below overrides the `{...props}` spread.
  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    props.onLoad?.(event);
  };
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    props.onError?.(event);
  };

  // Prepare the base style with responsive behavior
  const baseStyle = {
    // Modern responsive image approach
    maxWidth: '100%', // Ensure image doesn't exceed its container
    height: 'auto', // Maintain aspect ratio
    objectFit: objectFit,
    aspectRatio: `${width} / ${height}` // Maintain aspect ratio
  };

  return (
    <img
      {...props}
      ref={imgRef}
      // No wrapper element: `Image` renders on every storefront page, so an
      // extra node would change theme `>` selectors and remount the image when
      // the flag flips. The skeleton rides on the <img> itself — its box is
      // already sized by `aspectRatio` below, and the background shows through
      // until the bytes paint over it.
      className={
        showSkeleton
          ? `${props.className ?? ''} ${SKELETON_CLASS}`.trim()
          : props.className
      }
      data-image-state={showSkeleton ? 'loading' : 'ready'}
      onLoad={handleLoad}
      onError={handleError}
      src={shownSrc}
      srcSet={shownSrcSet}
      sizes={sizes}
      alt={alt}
      // Set intrinsic dimensions to help browser calculate aspect ratio
      width={width}
      height={height}
      style={{
        ...(unoptimized ? {} : baseStyle),
        ...props.style
      }}
      loading={loading}
      decoding={decoding}
      itemProp={priority ? 'preload' : undefined}
    />
  );
}
