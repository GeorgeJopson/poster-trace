import { preload } from "react-dom";
import { getImageProps, type ImageProps } from "next/image";

type PreloadResponsiveImageOptions = {
  /** Only preload when this media query matches, e.g. where the image is visible. */
  media?: string;
  fetchPriority?: "high" | "low" | "auto";
};

/*
 * Adds a `<link rel="preload">` for a `next/image` to the document head.
 *
 * Unlike the `preload` prop on `next/image`, this accepts a media query, so an
 * image that CSS hides on some screen sizes is only fetched where it shows.
 * Pass the same `src`/`sizes`/`fill` props as the rendered `<Image>` so the
 * browser reuses the preloaded file.
 */
export default function preloadResponsiveImage(
  imageProps: ImageProps,
  { media, fetchPriority }: PreloadResponsiveImageOptions = {},
) {
  const { props } = getImageProps(imageProps);

  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    media,
    fetchPriority,
  });
}
