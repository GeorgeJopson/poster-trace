/*
 * Central registry of image assets served from `public/`.
 *
 * Every `stockPoster` has empty alt text because the posters are purely
 * decorative and should not be announced to a screen reader.
 */

/** Decorative stock posters, in file order: `stockPosters[0]` is stock-poster-1.png. */
export const stockPosters = Array.from({ length: 7 }, (_, i) => ({
  src: `/poster-images/stock-poster-${i + 1}.png`,
  alt: "",
}));

/** UI icons, keyed by role. */
export const icons = {
  logo: { src: "/logo.svg", alt: "Poster Trace Logo" },
  rightArrow: { src: "/right-arrow.svg", alt: "Right arrow icon" },
  clipboard: { src: "/clipboard.svg", alt: "Clipboard icon" },
  map: { src: "/map.svg", alt: "Map Icon" },
  database: { src: "/database.svg", alt: "Database Icon" },
};

/** Example analytics visualisations, keyed by chart type. */
export const chartImages = {
  line: {
    src: "/analytics-images/line-chart.png",
    alt: "An example of a line chart displaying analytics from poster QR code scans.",
  },
  area: {
    src: "/analytics-images/area-chart.png",
    alt: "An example of an area chart displaying analytics from poster QR code scans.",
  },
  map: {
    src: "/analytics-images/map-chart.png",
    alt: "An example of a map displaying analytics of where poster QR code scans have occurred.",
  },
};
