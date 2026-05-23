import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Star, X } from "lucide-react";
import type { Location, LocationPhoto, LocationReview } from "../../../entities/location/model/types";

type TabKey = "description" | "photos" | "reviews";

type LocationDetailSheetProps = {
  isOpen: boolean;
  location: Location | null;
  photos: LocationPhoto[];
  reviews: LocationReview[];
  photosLoading: boolean;
  reviewsLoading: boolean;
  canContribute: boolean;
  onClose: () => void;
  onUploadPhoto: (file: File) => Promise<void>;
  onCreateReview: (rating: number, text: string | null) => Promise<void>;
};

const MAX_IMAGE_BYTES = 1024 * 1024;

export function LocationDetailSheet({
  isOpen,
  location,
  photos,
  reviews,
  photosLoading,
  reviewsLoading,
  canContribute,
  onClose,
  onUploadPhoto,
  onCreateReview,
}: LocationDetailSheetProps) {
  const [tab, setTab] = useState<TabKey>("description");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState<"photo" | "review" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avgRating = useMemo(() => {
    if (!reviews.length) {
      return null;
    }
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  if (!isOpen || !location) {
    return null;
  }

  const handlePickFile = () => {
    if (!canContribute || busy) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 1MB or smaller.");
      return;
    }
    try {
      setError(null);
      setBusy("photo");
      await onUploadPhoto(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setBusy(null);
    }
  };

  const handleSubmitReview = async () => {
    const normalized = reviewText.trim();
    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5.");
      return;
    }
    try {
      setError(null);
      setBusy("review");
      await onCreateReview(rating, normalized.length ? normalized : null);
      setReviewText("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add review");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Location details">
      <div className="bottom-sheet location-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3>{location.name}</h3>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="sheet-coords">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          {avgRating ? <span className="location-detail-rating">★ {avgRating}</span> : null}
        </p>

        <div className="location-detail-tabs" role="tablist" aria-label="Location detail tabs">
          <button type="button" className={tab === "description" ? "active" : ""} onClick={() => setTab("description")}>
            Description
          </button>
          <button type="button" className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")}>
            Photos
          </button>
          <button type="button" className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>
            Reviews
          </button>
        </div>

        <div className="sheet-body location-detail-body">
          {tab === "description" ? (
            <div>
              <p>{location.description?.trim() || "No description yet."}</p>
              {location.website_url ? (
                <a className="location-card__link" href={location.website_url} target="_blank" rel="noreferrer">
                  Visit website
                </a>
              ) : null}
            </div>
          ) : null}

          {tab === "photos" ? (
            <div>
              <div className="location-detail-toolbar">
                <button type="button" className="btn-primary" disabled={!canContribute || busy !== null} onClick={handlePickFile}>
                  {busy === "photo" ? "Uploading..." : "Add photo"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handlePhotoChange} />
              </div>
              {photosLoading ? <p>Loading photos...</p> : null}
              {!photosLoading && photos.length === 0 ? <p>No photos yet.</p> : null}
              <div className="location-photo-grid">
                {photos.map((photo) => (
                  <a key={photo.id} href={photo.image_url} target="_blank" rel="noreferrer">
                    <img src={photo.image_url} alt="Location upload" loading="lazy" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div>
              <div className="location-detail-toolbar">
                <div className="star-input" aria-label="Review rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} className={value <= rating ? "active" : ""} aria-label={`${value} star`}>
                      <Star size={16} fill={value <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="field-textarea"
                placeholder="Write a review (optional if you rate)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={600}
              />
              <button type="button" className="btn-primary" disabled={!canContribute || busy !== null} onClick={handleSubmitReview}>
                {busy === "review" ? "Adding..." : "Add review"}
              </button>
              {reviewsLoading ? <p>Loading reviews...</p> : null}
              {!reviewsLoading && reviews.length === 0 ? <p>No reviews yet.</p> : null}
              <div className="location-review-list">
                {reviews.map((review) => (
                  <article key={review.id} className="location-review-item">
                    <div>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                    {review.text ? <p>{review.text}</p> : <p className="muted">No text review</p>}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="location-detail-error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
