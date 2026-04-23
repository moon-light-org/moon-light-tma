import { X, MapPin } from "lucide-react";

type TapLocationSheetProps = {
  isOpen: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  onAddLocation: () => void;
  onClose: () => void;
};

export function TapLocationSheet({ isOpen, coordinates, onAddLocation, onClose }: TapLocationSheetProps) {
  if (!isOpen || !coordinates) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Selected location">
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <h3>Add a spot here?</h3>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="sheet-coords">
          <MapPin size={13} />
          {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
        </p>

        <div className="sheet-actions">
          <button type="button" className="btn-primary" onClick={onAddLocation}>
            Add Bitcoin-friendly location
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
