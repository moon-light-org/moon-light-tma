import { useState } from "react";
import { X, MapPin, AlertCircle, ShoppingBag, Utensils, Grid2x2 } from "lucide-react";
import type { CreateLocationPayload, LocationCategory } from "../../../entities/location/model/types";

type AddLocationModalProps = {
  isOpen: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  telegramId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLocationPayload) => Promise<void>;
};

const categories: Array<{ value: LocationCategory; label: string; Icon: React.ElementType }> = [
  { value: "grocery",        label: "Grocery",    Icon: ShoppingBag },
  { value: "restaurant-bar", label: "Food & Bar", Icon: Utensils },
  { value: "other",          label: "Other",      Icon: Grid2x2 },
];

export function AddLocationModal({
  isOpen,
  coordinates,
  telegramId,
  isSubmitting,
  onClose,
  onSubmit,
}: AddLocationModalProps) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState<LocationCategory>("other");
  const [websiteUrl,  setWebsiteUrl]  = useState("");
  const [schedules,   setSchedules]   = useState("");
  const [error,       setError]       = useState<string | null>(null);

  if (!isOpen || !coordinates) return null;

  const reset = () => {
    setName(""); setDescription(""); setCategory("other");
    setWebsiteUrl(""); setSchedules(""); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Location name is required"); return; }
    try {
      setError(null);
      await onSubmit({
        telegramId,
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        category,
        websiteUrl: websiteUrl.trim() || undefined,
        schedules: schedules.trim() || undefined,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    }
  };

  return (
    <div className="sheet-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-label="Add location">
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <h2>Add location</h2>
          <button type="button" className="sheet-close" onClick={handleClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="sheet-coords">
          <MapPin size={13} />
          {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
        </p>

        <div className="sheet-body">
          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="loc-name">Name</label>
            <input
              id="loc-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bitcoin Café"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <span className="form-label">Category</span>
            <div className="category-pills">
              {categories.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`category-pill${category === value ? " is-active" : ""}`}
                  onClick={() => setCategory(value)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loc-desc">Description</label>
            <textarea
              id="loc-desc"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this spot BTC-friendly?"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loc-url">Website</label>
            <input
              id="loc-url"
              className="form-input"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              inputMode="url"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loc-hours">Opening hours</label>
            <input
              id="loc-hours"
              className="form-input"
              value={schedules}
              onChange={(e) => setSchedules(e.target.value)}
              placeholder="Mon–Sat  10:00–20:00"
            />
          </div>
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Create location"}
          </button>
        </div>
      </div>
    </div>
  );
}
