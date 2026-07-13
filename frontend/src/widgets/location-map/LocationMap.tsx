import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import type { Location } from "../../entities/location/model/types";

type MapProps = {
  locations: Location[];
  onMapPickLocation: (lat: number, lng: number) => void;
  onLocationSelect: (location: Location | null) => void;
  onViewportChange?: (bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  }) => void;
  initialCenter?: { latitude: number; longitude: number };
  focusCoordinates?: { latitude: number; longitude: number } | null;
  userLocation?: { latitude: number; longitude: number } | null;
};

const SOURCE_ID = "saved-locations";
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const POINT_LAYER_ID = "unclustered";
const USER_LOCATION_SOURCE_ID = "user-location";
const USER_LOCATION_ACCURACY_LAYER_ID = "user-location-accuracy";
const USER_LOCATION_POINT_LAYER_ID = "user-location-point";
const FALLBACK_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

function toGeoJson(locations: Location[]): FeatureCollection<Point> {
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
          category: location.category,
        },
      })),
  };
}

export function LocationMap({
  locations,
  onMapPickLocation,
  onLocationSelect,
  onViewportChange,
  initialCenter = { latitude: 48.8566, longitude: 2.3522 },
  focusCoordinates = null,
  userLocation = null,
}: MapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const geoJson = useMemo(() => toGeoJson(locations), [locations]);
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

    if (feature?.layer?.id === POINT_LAYER_ID) {
      const id = Number(feature.properties?.id);
      const selected = locations.find((location) => location.id === id) ?? null;
      onLocationSelect(selected);
      return;
    }

    onLocationSelect(null);
    onMapPickLocation(event.lngLat.lat, event.lngLat.lng);
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: initialCenter.latitude,
        longitude: initialCenter.longitude,
        zoom: 12,
      }}
      mapStyle={FALLBACK_MAP_STYLE}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      interactiveLayerIds={[CLUSTER_LAYER_ID, POINT_LAYER_ID]}
      onLoad={emitViewportBounds}
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
          id={POINT_LAYER_ID}
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": "#1a73e8",
            "circle-radius": 8,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2.5,
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
