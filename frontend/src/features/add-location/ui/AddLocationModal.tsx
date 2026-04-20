import { useState } from "react";
import type { CreateLocationPayload, LocationCategory } from "../../../entities/location/model/types";

type AddLocationModalProps = {
  isOpen: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  telegramId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLocationPayload) => Promise<void>;
};

const categories: Array<{ value: LocationCategory; label: string }> = [
  { value: "grocery", label: "Grocery" },
  { value: "restaurant-bar", label: "Restaurant / Bar" },
  { value: "other", label: "Other" },
];

export function AddLocationModal({
  isOpen,
  coordinates,
  telegramId,
  isSubmitting,
  onClose,
  onSubmit,
}: AddLocationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<LocationCategory>("other");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [schedules, setSchedules] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !coordinates) {
    return null;
  }

  const reset = () => {
    setName("");
    setDescription("");
    setCategory("other");
    setWebsiteUrl("");
    setImageUrl("");
    setSchedules("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Location name is required");
      return;
    }

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
        imageUrl: imageUrl.trim() || undefined,
        schedules: schedules.trim() || undefined,
      });
      reset();
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create location";
      setError(message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Location</h2>
          <button type="button" onClick={handleClose} className="ghost-button">
            Close
          </button>
        </div>

        <p className="coordinates">
          {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
        </p>

        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="BTC-friendly cafe" />
        </label>

        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value as LocationCategory)}>
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What can people expect here?"
          />
        </label>

        <label>
          Website URL
          <input
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <label>
          Image URL
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </label>

        <label>
          Opening Hours
          <input value={schedules} onChange={(event) => setSchedules(event.target.value)} placeholder="Mon-Sat 10:00-20:00" />
        </label>

        {error ? <p className="error-message">{error}</p> : null}

        <button type="button" className="primary-button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Location"}
        </button>
      </div>
    </div>
  );
}
