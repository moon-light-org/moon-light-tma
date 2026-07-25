import { Crosshair } from "lucide-react";

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
    </div>
  );
}
