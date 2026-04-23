import { Crosshair, Plus } from "lucide-react";

type HomeControlsProps = {
  canLocate: boolean;
  onLocateMe: () => void;
};

export function HomeControls({ canLocate, onLocateMe }: HomeControlsProps) {
  return (
    <div className="map-actions">
      {canLocate && (
        <button
          type="button"
          className="map-btn"
          onClick={onLocateMe}
          aria-label="Center on my location"
        >
          <Crosshair size={20} />
        </button>
      )}
      <button
        type="button"
        className="map-btn map-btn--accent"
        aria-label="Add a Bitcoin-friendly location — tap anywhere on the map"
        title="Tap the map to place a new spot"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
