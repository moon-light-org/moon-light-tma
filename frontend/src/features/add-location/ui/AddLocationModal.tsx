import { useState } from "react";
import { X, MapPin, AlertCircle } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE, MAIN_CATEGORY_OPTIONS } from "../../../entities/location/model/mainCategories";
import type { CreateLocationPayload, LocationMainCategory } from "../../../entities/location/model/types";
import { CREATE_LOCATION_LOADING_LOTTIE_SRC } from "../../../shared/ui/lotties";

type AddLocationModalProps = {
  isOpen: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLocationPayload) => Promise<void>;
};

export function AddLocationModal({
  isOpen,
  coordinates,
  isSubmitting,
  onClose,
  onSubmit,
}: AddLocationModalProps) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [mainCategory, setMainCategory] = useState<LocationMainCategory>("other");
  const [websiteUrl,  setWebsiteUrl]  = useState("");
  const [schedules,   setSchedules]   = useState("");
  const [error,       setError]       = useState<string | null>(null);

  if (!isOpen || !coordinates) return null;

  const reset = () => {
    setName(""); setDescription(""); setMainCategory("other");
    setWebsiteUrl(""); setSchedules(""); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Location name is required"); return; }
    try {
      setError(null);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        category: MAIN_CATEGORY_BY_VALUE[mainCategory].legacyCategory,
        mainCategory,
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
              {MAIN_CATEGORY_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`category-pill${mainCategory === value ? " is-active" : ""}`}
                  onClick={() => setMainCategory(value)}
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
            {isSubmitting ? (
              <span className="create-location-loading">
                <dotlottie-wc
                  className="create-location-loading-lottie"
                  src={CREATE_LOCATION_LOADING_LOTTIE_SRC}
                  autoplay
                  loop
                  aria-hidden="true"
                />
                <span>Creating...</span>
              </span>
            ) : (
              "Create location"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
