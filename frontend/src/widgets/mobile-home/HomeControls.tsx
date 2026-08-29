import { Crosshair, Minus, Plus } from "lucide-react";

type HomeControlsProps = {
  canLocate: boolean;
  onLocateMe: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function HomeControls({ canLocate, onLocateMe, onZoomIn, onZoomOut }: HomeControlsProps) {
  return (
    <div className="map-actions">
      <div className="map-zoom-group">
        <button type="button" className="map-btn map-btn--zoom" onClick={onZoomIn} aria-label="Zoom in">
          <Plus size={20} />
        </button>
        <button type="button" className="map-btn map-btn--zoom" onClick={onZoomOut} aria-label="Zoom out">
          <Minus size={20} />
        </button>
      </div>
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
