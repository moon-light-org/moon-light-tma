import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { Location, LocationMainCategory } from "../../entities/location/model/types";

type MapProps = {
  locations: Location[];
  selectedLocationId: number | null;
  isPickingLocation: boolean;
  onMapPickLocation: (lat: number, lng: number) => void;
  onLocationSelect: (location: Location | null) => void;
  onViewportChange?: (bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  }) => void;
  initialCenter?: { latitude: number; longitude: number } | null;
  focusCoordinates?: { latitude: number; longitude: number } | null;
  userLocation?: { latitude: number; longitude: number } | null;
};

const SOURCE_ID = "saved-locations";
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const POINT_FALLBACK_LAYER_ID = "unclustered-fallback";
const POINT_LAYER_ID = "unclustered";
const USER_LOCATION_SOURCE_ID = "user-location";
const USER_LOCATION_ACCURACY_LAYER_ID = "user-location-accuracy";
const USER_LOCATION_POINT_LAYER_ID = "user-location-point";
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const markerIconPaths: Record<LocationMainCategory, string> = {
  accommodation: '<path d="M7 25v-8m0 4h18a4 4 0 0 1 4 4v4M7 29v-8h7a4 4 0 0 1 4 4v4M7 29h22"/>',
  bitcoin: '<text x="18" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="currentColor" stroke="none">&#8383;</text>',
  food_drink: '<path d="M10 13v8m4-8v8m-2-8v16m9-16v16m0-16c5 3 5 9 0 11"/>',
  other: '<rect x="9" y="13" width="7" height="7" rx="1"/><rect x="20" y="13" width="7" height="7" rx="1"/><rect x="9" y="24" width="7" height="7" rx="1"/><rect x="20" y="24" width="7" height="7" rx="1"/>',
  retail: '<path d="M9 18h18l-2 13H11L9 18Z"/><path d="M14 19v-2a4 4 0 0 1 8 0v2"/>',
  services: '<path d="m11 29 9-9m-7-6a6 6 0 0 0 7 7l8 8-3 3-8-8a6 6 0 0 1-7-7l4 2 3-3-2-4Z"/>',
};

function markerSvg(category: LocationMainCategory, verified: boolean): string {
  const fill = verified ? "#172554" : "#ffffff";
  const stroke = verified ? "#172554" : "#64748b";
  const icon = verified ? "#ffffff" : "#334155";
  const badge = verified
    ? '<circle cx="35" cy="10" r="8" fill="#f59e0b" stroke="#fff" stroke-width="2"/><path d="m36 4-5 7h4l-1 6 5-8h-4l1-5Z" fill="#fff" stroke="none"/>'
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56"><path d="M24 53C21 45 6 37 6 23a18 18 0 1 1 36 0c0 14-15 22-18 30Z" fill="${fill}" stroke="#fff" stroke-width="5"/><path d="M24 50C20 42 9 35 9 23a15 15 0 1 1 30 0c0 12-11 19-15 27Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/><g transform="translate(6 3)" color="${icon}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${markerIconPaths[category]}</g>${badge}</svg>`;
}

function rasterizeMarker(svg: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const width = 48;
    const height = 56;
    const pixelRatio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Canvas is unavailable"));
      return;
    }

    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    image.onload = () => {
      context.scale(pixelRatio, pixelRatio);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not rasterize map marker"));
    };
    image.src = url;
  });
}

async function registerMarkerImages(map: MapLibreMap) {
  const categories = Object.keys(markerIconPaths) as LocationMainCategory[];
  await Promise.all(categories.flatMap((category) => [false, true].map(async (verified) => {
    const id = `${category}-${verified ? "verified" : "unverified"}`;
    if (map.hasImage(id)) return;
    const image = await rasterizeMarker(markerSvg(category, verified));
    if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 });
  })));
}

function toGeoJson(locations: Location[], selectedLocationId: number | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: locations
      .filter(
        (location) =>
          Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
      )
      .map((location) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [location.longitude, location.latitude],
        },
        properties: {
          id: location.id,
          name: location.name,
          description: location.description,
          mainCategory: location.main_category,
          isApproved: location.is_approved,
          selected: location.id === selectedLocationId,
        },
      })),
  };
}

export function LocationMap({
  locations,
  selectedLocationId,
  isPickingLocation,
  onMapPickLocation,
  onLocationSelect,
  onViewportChange,
  initialCenter = null,
  focusCoordinates = null,
  userLocation = null,
}: MapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const geoJson = useMemo(() => toGeoJson(locations, selectedLocationId), [locations, selectedLocationId]);
  const userLocationGeoJson = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features:
        userLocation &&
        Number.isFinite(userLocation.latitude) &&
        Number.isFinite(userLocation.longitude)
          ? [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [userLocation.longitude, userLocation.latitude],
                },
                properties: {},
              },
            ]
          : [],
    }),
    [userLocation]
  );

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !focusCoordinates) {
      return;
    }
    map.easeTo({
      center: [focusCoordinates.longitude, focusCoordinates.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 450,
    });
  }, [focusCoordinates]);

  useEffect(() => {
    const canvas = mapRef.current?.getMap().getCanvas();
    if (canvas) canvas.style.cursor = isPickingLocation ? "crosshair" : "";
  }, [isPickingLocation]);

  const emitViewportBounds = () => {
    const bounds = mapRef.current?.getMap().getBounds();
    if (!bounds || !onViewportChange) {
      return;
    }
    onViewportChange({
      minLat: bounds.getSouth(),
      minLon: bounds.getWest(),
      maxLat: bounds.getNorth(),
      maxLon: bounds.getEast(),
    });
  };

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    const feature = event.features?.[0];
    if (feature?.layer?.id === CLUSTER_LAYER_ID) {
      const source = map.getSource(SOURCE_ID) as unknown as {
        getClusterExpansionZoom: (clusterId: number) => Promise<number>;
      };
      const clusterId = Number(feature.properties?.cluster_id);
      if (!Number.isFinite(clusterId)) {
        return;
      }

      const zoom = await source.getClusterExpansionZoom(clusterId);
      const [longitude, latitude] = (feature.geometry as Point).coordinates;
      map.easeTo({ center: [longitude, latitude], zoom, duration: 400 });
      onLocationSelect(null);
      return;
    }

    if (feature?.layer?.id === POINT_LAYER_ID || feature?.layer?.id === POINT_FALLBACK_LAYER_ID) {
      const id = Number(feature.properties?.id);
      const selected = locations.find((location) => location.id === id) ?? null;
      onLocationSelect(selected);
      return;
    }

    onLocationSelect(null);
    if (isPickingLocation) onMapPickLocation(event.lngLat.lat, event.lngLat.lng);
  };

  const handleMapLoad = () => {
    emitViewportBounds();
    const map = mapRef.current?.getMap();
    if (map) void registerMarkerImages(map).catch((error: unknown) => {
      console.error("[map] Failed to register category markers", error);
    });
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: initialCenter?.latitude ?? 20,
        longitude: initialCenter?.longitude ?? 0,
        zoom: initialCenter ? 12 : 2,
      }}
      mapStyle={MAP_STYLE_URL}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      interactiveLayerIds={[CLUSTER_LAYER_ID, POINT_LAYER_ID, POINT_FALLBACK_LAYER_ID]}
      onLoad={handleMapLoad}
      onMoveEnd={emitViewportBounds}
      onClick={handleMapClick}
    >
      <Source
        id={SOURCE_ID}
        type="geojson"
        data={geoJson}
        cluster
        clusterRadius={48}
        clusterMaxZoom={14}
      >
        <Layer
          id={CLUSTER_LAYER_ID}
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": "#f7931a",
            "circle-radius": ["step", ["get", "point_count"], 18, 20, 22, 50, 26],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2.5,
          }}
        />
        <Layer
          id={CLUSTER_COUNT_LAYER_ID}
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": "{point_count_abbreviated}",
            "text-size": 12,
            "text-font": ["Noto Sans Bold"],
          }}
          paint={{
            "text-color": "#ffffff",
          }}
        />
        <Layer
          id={POINT_FALLBACK_LAYER_ID}
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": ["case", ["get", "isApproved"], "#172554", "#ffffff"],
            "circle-radius": ["case", ["get", "selected"], 12, 9],
            "circle-stroke-color": ["case", ["get", "isApproved"], "#f59e0b", "#64748b"],
            "circle-stroke-width": ["case", ["get", "isApproved"], 3, 2.5],
          }}
        />
        <Layer
          id={POINT_LAYER_ID}
          type="symbol"
          filter={["!", ["has", "point_count"]]}
          layout={{
            "icon-image": ["concat", ["get", "mainCategory"], ["case", ["get", "isApproved"], "-verified", "-unverified"]],
            "icon-size": ["case", ["get", "selected"], 1.28, 0.88],
            "icon-anchor": "bottom",
            "icon-allow-overlap": ["get", "selected"],
            "symbol-sort-key": ["case", ["get", "selected"], 10, ["get", "isApproved"], 5, 1],
          }}
        />
      </Source>
      <Source id={USER_LOCATION_SOURCE_ID} type="geojson" data={userLocationGeoJson}>
        <Layer
          id={USER_LOCATION_ACCURACY_LAYER_ID}
          type="circle"
          paint={{
            "circle-color": "rgba(26, 115, 232, 0.18)",
            "circle-radius": 18,
            "circle-stroke-color": "rgba(26, 115, 232, 0.28)",
            "circle-stroke-width": 1,
          }}
        />
        <Layer
          id={USER_LOCATION_POINT_LAYER_ID}
          type="circle"
          paint={{
            "circle-color": "#1a73e8",
            "circle-radius": 7,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
          }}
        />
      </Source>
    </Map>
  );
}
