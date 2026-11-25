"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useEffectEvent, useRef } from "react";

import type { Map as MaplibreMap, MapOptions } from "maplibre-gl";

import styles from "./MapLibreMap.module.css";

export type MapLibre = typeof import("maplibre-gl");

/** Everything but what every map shares: its container, style and attribution. */
export type MapLibreMapOptions = Omit<
  MapOptions,
  "container" | "style" | "attributionControl"
>;

// CARTO's Voyager style, used straight from CARTO: its tile, glyph and sprite
// URLs change, so it isn't copied here, and CARTO's terms forbid proxying or
// caching its tiles. The key is public; CARTO restricts it to our websites.
const STYLE_URL = `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=${process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY}`;

interface MapLibreMapProps {
  /** Read once, when the map is made. Remount the map to change them. */
  options: MapLibreMapOptions;
  /**
   * Called once the style has loaded, to add layers, markers or controls.
   * Gets the MapLibre module too, so callers needn't import it themselves.
   */
  onLoad?: (map: MaplibreMap, maplibre: MapLibre) => void;
  /** Sizes the map; it has no height of its own. */
  className?: string;
}

/**
 * A MapLibre map on CARTO's basemap. MapLibre needs WebGL, so it's only
 * imported in the browser, once the map is shown. The map is removed when
 * this unmounts.
 */
export default function MapLibreMap({
  options,
  onLoad,
  className,
}: MapLibreMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const initialOptions = useRef(options);
  const handleLoad = useEffectEvent((map: MaplibreMap, maplibre: MapLibre) =>
    onLoad?.(map, maplibre),
  );

  useEffect(() => {
    let map: MaplibreMap | undefined;
    let cancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !container.current) return;
      // MapLibre finds its worker next to its own module, which isn't where
      // the bundler puts it, so point it at the worker explicitly.
      maplibre.setWorkerUrl(
        new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url)
          .href,
      );

      const newMap = new maplibre.Map({
        ...initialOptions.current,
        container: container.current,
        style: STYLE_URL,
        // CARTO's terms need its and OpenStreetMap's attribution to stay
        // visible, so it's never collapsed into a button.
        attributionControl: { compact: false },
      });
      map = newMap;
      newMap.on("load", () => handleLoad(newMap, maplibre));
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={container}
      className={className ? `${styles.map} ${className}` : styles.map}
    />
  );
}
