"use client";

import type {
  ExpressionSpecification,
  LngLatBoundsLike,
  Map as MaplibreMap,
} from "maplibre-gl";

import type { MapPosterDto } from "@application/dto/AnalyticsDto";
import MapLibreMap from "@/components/MapLibreMap";

import styles from "./ScanMap.module.css";

/** Street level: posters are labelled with their scan counts from here. */
const STREET_ZOOM = 15;
/** Where each poster's circle starts fading in over the heat map. */
const CIRCLES_ZOOM = 13;
/** One of the basemap's own fonts, so CARTO serves its glyphs. */
const LABEL_FONT = ["Montserrat SemiBold", "Open Sans Bold"];

interface ScanMapCanvasProps {
  /** At least one. */
  posters: MapPosterDto[];
  maxScanCount: number;
}

/** The map itself, framing every located poster. */
export default function ScanMapCanvas({
  posters,
  maxScanCount,
}: ScanMapCanvasProps) {
  const longitudes = posters.map(({ longitude }) => longitude);
  const latitudes = posters.map(({ latitude }) => latitude);
  const bounds: LngLatBoundsLike = [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];

  function addPosters(map: MaplibreMap) {
    map.addSource("posters", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: posters.map(
          ({ posterId, longitude, latitude, scanCount }) => ({
            type: "Feature",
            id: posterId,
            geometry: { type: "Point", coordinates: [longitude, latitude] },
            properties: { scanCount },
          }),
        ),
      },
    });
    map.addLayer({
      id: "scan-heat",
      type: "heatmap",
      source: "posters",
      paint: {
        // Relative to the campaign's most scanned poster, so the hottest
        // spot is always fully hot. Posters with no scans add no heat.
        "heatmap-weight": [
          "/",
          ["get", "scanCount"],
          Math.max(maxScanCount, 1),
        ],
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          1,
          STREET_ZOOM,
          3,
        ],
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          4,
          9,
          24,
          STREET_ZOOM,
          48,
          20,
          96,
        ],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(33, 102, 172, 0)",
          0.2,
          "rgb(103, 169, 207)",
          0.4,
          "rgb(209, 229, 240)",
          0.6,
          "rgb(253, 219, 199)",
          0.8,
          "rgb(239, 138, 98)",
          1,
          "rgb(178, 24, 43)",
        ],
        // Kept at every zoom, a little fainter once the circles are on
        // top, so they stand out.
        "heatmap-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          CIRCLES_ZOOM,
          0.85,
          STREET_ZOOM,
          0.6,
        ],
      },
    });
    // Fades in over the zoom levels from `from`.
    const fadeIn = (from: number): ExpressionSpecification => [
      "interpolate",
      ["linear"],
      ["zoom"],
      from,
      0,
      from + 1,
      1,
    ];
    // Every located poster looks the same up close, scanned or not.
    map.addLayer({
      id: "poster-circles",
      type: "circle",
      source: "posters",
      minzoom: CIRCLES_ZOOM,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          CIRCLES_ZOOM,
          4,
          18,
          10,
        ],
        "circle-color": "rgb(178, 24, 43)",
        "circle-stroke-color": "white",
        "circle-stroke-width": 2,
        "circle-opacity": fadeIn(CIRCLES_ZOOM),
        "circle-stroke-opacity": fadeIn(CIRCLES_ZOOM),
      },
    });
    map.addLayer({
      id: "poster-scan-counts",
      type: "symbol",
      source: "posters",
      minzoom: STREET_ZOOM,
      layout: {
        "text-field": [
          "case",
          ["==", ["get", "scanCount"], 1],
          "1 scan",
          ["concat", ["to-string", ["get", "scanCount"]], " scans"],
        ],
        "text-font": LABEL_FONT,
        "text-size": 13,
        "text-anchor": "top",
        "text-offset": [0, 0.9],
      },
      paint: {
        "text-color": "rgb(40, 40, 40)",
        "text-halo-color": "white",
        "text-halo-width": 1.5,
        "text-opacity": fadeIn(STREET_ZOOM),
      },
    });
  }

  return (
    <MapLibreMap
      // The map reads its data once, so new data makes a new map.
      key={JSON.stringify([posters, maxScanCount])}
      options={{
        bounds,
        // Also centres a single poster (or several in one spot) at street level.
        fitBoundsOptions: { padding: 48, maxZoom: STREET_ZOOM },
      }}
      onLoad={addPosters}
      className={styles.map}
    />
  );
}
