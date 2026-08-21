import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
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
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

const markerCategories: LocationMainCategory[] = ["accommodation", "bitcoin", "food_drink", "other", "retail", "services"];

function strokeLine(context: CanvasRenderingContext2D, draw: () => void) {
  context.beginPath();
  draw();
  context.stroke();
}

function drawCategoryIcon(context: CanvasRenderingContext2D, category: LocationMainCategory) {
  context.save();
  context.strokeStyle = "#ffffff";
  context.fillStyle = "#ffffff";
  context.lineWidth = 2.1;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (category === "bitcoin") {
    context.font = "700 19px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("₿", 24, 24);
  } else if (category === "food_drink") {
    strokeLine(context, () => {
      context.moveTo(18, 16);
      context.lineTo(18, 31);
      context.moveTo(15, 16);
      context.lineTo(15, 23);
      context.moveTo(21, 16);
      context.lineTo(21, 23);
      context.moveTo(15, 23);
      context.lineTo(21, 23);
      context.moveTo(28, 16);
      context.lineTo(28, 31);
      context.moveTo(28, 16);
      context.quadraticCurveTo(34, 20, 28, 25);
    });
  } else if (category === "accommodation") {
    strokeLine(context, () => {
      context.moveTo(15, 19);
      context.lineTo(15, 31);
      context.moveTo(15, 25);
      context.lineTo(33, 25);
      context.moveTo(33, 23);
      context.quadraticCurveTo(33, 20, 30, 20);
      context.lineTo(23, 20);
      context.quadraticCurveTo(20, 20, 20, 23);
      context.moveTo(33, 25);
      context.lineTo(33, 31);
    });
  } else if (category === "retail") {
    strokeLine(context, () => {
      context.moveTo(16, 21);
      context.lineTo(32, 21);
      context.lineTo(30, 32);
      context.lineTo(18, 32);
      context.closePath();
      context.moveTo(20, 21);
      context.quadraticCurveTo(20, 16, 24, 16);
      context.quadraticCurveTo(28, 16, 28, 21);
    });
  } else if (category === "services") {
    strokeLine(context, () => {
      context.moveTo(17, 31);
      context.lineTo(31, 17);
      context.moveTo(19, 16);
      context.lineTo(24, 21);
      context.moveTo(29, 27);
      context.lineTo(32, 30);
      context.moveTo(14, 28);
      context.lineTo(18, 32);
    });
  } else {
    for (const [x, y] of [[17, 17], [25, 17], [17, 25], [25, 25]]) {
      context.beginPath();
      context.rect(x, y, 5, 5);
      context.fill();
    }
  }

  context.restore();
}

function rasterizeMarker(category: LocationMainCategory, verified: boolean): ImageData {
  const stroke = verified ? "#f29900" : "#cbd5e1";
  const spot = verified ? "#f29900" : "#f6b544";
  const width = 48;
  const height = 56;
  const pixelRatio = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable");
  }

  context.scale(pixelRatio, pixelRatio);
  context.shadowColor = "rgba(15, 23, 42, 0.22)";
  context.shadowBlur = 5;
  context.shadowOffsetY = 3;
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(24, 53);
  context.bezierCurveTo(21, 45, 6, 37, 6, 23);
  context.arc(24, 23, 18, Math.PI, 0, false);
  context.bezierCurveTo(42, 37, 27, 45, 24, 53);
  context.closePath();
  context.fill();
  context.stroke();

  context.shadowColor = "transparent";
  context.lineWidth = 2;
  context.strokeStyle = stroke;
  context.beginPath();
  context.moveTo(24, 50);
  context.bezierCurveTo(20, 42, 9, 35, 9, 23);
  context.arc(24, 23, 15, Math.PI, 0, false);
  context.bezierCurveTo(39, 35, 28, 42, 24, 50);
  context.closePath();
  context.fillStyle = "#ffffff";
  context.fill();
  context.stroke();

  context.beginPath();
  context.arc(24, 24, 13.5, 0, Math.PI * 2);
  context.fillStyle = spot;
  context.fill();
  context.strokeStyle = "#ffffff";
  context.stroke();

  drawCategoryIcon(context, category);

  if (verified) {
    context.beginPath();
    context.arc(35, 10, 8, 0, Math.PI * 2);
    context.fillStyle = "#1a73e8";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#ffffff";
    context.stroke();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(36, 4);
    context.lineTo(31, 11);
    context.lineTo(35, 11);
    context.lineTo(34, 17);
    context.lineTo(39, 9);
    context.lineTo(35, 9);
    context.closePath();
    context.fill();
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function registerMarkerImages(map: ReturnType<MapRef["getMap"]>) {
  for (const category of markerCategories) {
    for (const verified of [false, true]) {
    const id = `${category}-${verified ? "verified" : "unverified"}`;
    if (map.hasImage(id)) continue;
    const image = rasterizeMarker(category, verified);
    if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 });
    }
  }
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
    map.flyTo({
      center: [focusCoordinates.longitude, focusCoordinates.latitude],
      zoom: Math.max(map.getZoom(), 15),
      duration: 900,
      essential: true,
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
    if (map) {
      try {
        registerMarkerImages(map);
      } catch (error) {
        console.error("[map] Failed to register category markers", error);
      }
    }
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
            "circle-color": "#f29900",
            "circle-radius": ["step", ["get", "point_count"], 18, 20, 22, 50, 26],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
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
            "circle-color": "#ffffff",
            "circle-radius": ["case", ["get", "selected"], 12, 9],
            "circle-stroke-color": ["case", ["get", "isApproved"], "#f29900", "#cbd5e1"],
            "circle-stroke-width": ["case", ["get", "isApproved"], 3, 2],
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
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
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
