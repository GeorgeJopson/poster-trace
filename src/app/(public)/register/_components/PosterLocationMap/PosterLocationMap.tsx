"use client";

import { useEffect, useRef } from "react";

import type { Map as MaplibreMap, Marker } from "maplibre-gl";

import type { RegistrationLocationInput } from "@application/dto/inputs";
import MapLibreMap, { type MapLibre } from "@/components/MapLibreMap";

import styles from "./PosterLocationMap.module.css";

/** Street level, close enough to pick out the poster's spot. */
const ZOOM = 17;
/** The scan map's poster colour. */
const PIN_COLOUR = "rgb(178, 24, 43)";

interface PosterLocationMapProps {
  location: RegistrationLocationInput;
  /**
   * The latest fix. When it changes while the map is shown, the pin moves to
   * it and the map recentres on it.
   */
  fix?: RegistrationLocationInput | null;
  /**
   * Called when the pin is dragged. Without it, the map and pin can't be
   * moved.
   */
  onMove?: (location: RegistrationLocationInput) => void;
}

/** A map centred on a poster's location, with a pin on it. */
export default function PosterLocationMap({
  location,
  fix = null,
  onMove,
}: PosterLocationMapProps) {
  const map = useRef<MaplibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const shownFix = useRef(fix);
  const editable = onMove !== undefined;
  // The pin's drag handler is added once, outside any effect, so it reads the
  // latest onMove through a ref (an Effect Event can't be called from it).
  const latestOnMove = useRef(onMove);
  useEffect(() => {
    latestOnMove.current = onMove;
  });

  useEffect(() => {
    if (fix === shownFix.current) return;
    shownFix.current = fix;
    // Before the map loads, onLoad places the pin at the latest location.
    if (!fix || !map.current || !marker.current) return;
    marker.current.setLngLat([fix.longitude, fix.latitude]);
    map.current.jumpTo({ center: [fix.longitude, fix.latitude], zoom: ZOOM });
  }, [fix]);

  // Called with the latest props, so a fix taken while the map loads counts.
  function addPin(loadedMap: MaplibreMap, maplibre: MapLibre) {
    const at: [number, number] = [location.longitude, location.latitude];
    const pin = new maplibre.Marker({ color: PIN_COLOUR, draggable: editable })
      .setLngLat(at)
      .addTo(loadedMap);
    pin.on("dragend", () => {
      // Dragged past the antimeridian, it's still a real longitude.
      const { lng, lat } = pin.getLngLat().wrap();
      latestOnMove.current?.({ latitude: lat, longitude: lng });
    });
    loadedMap.jumpTo({ center: at });
    map.current = loadedMap;
    marker.current = pin;
  }

  return (
    <MapLibreMap
      options={{
        center: [location.longitude, location.latitude],
        zoom: ZOOM,
        interactive: editable,
      }}
      onLoad={addPin}
      className={editable ? styles.editable : styles.preview}
    />
  );
}
