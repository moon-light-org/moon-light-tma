import { useMemo, useState } from "react";
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
  onCreateReview: (rating: number, text: string | null) => Promise<void>;
};

export function LocationDetailSheet({
  isOpen,
  location,
  photos,
  reviews,
  photosLoading,
  reviewsLoading,
  canContribute,
  onClose,
  onCreateReview,
}: LocationDetailSheetProps) {
  const [tab, setTab] = useState<TabKey>("description");
  const [rating, setRating] = useState(5);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState<"review" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const avgRating = useMemo(() => {
    if (!reviews.length) {
      return null;
    }
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);
  const orderedPhotos = useMemo(() => {
    const list = [...photos];
    if (location?.image_url) {
      const alreadyPresent = list.some((p) => p.image_url === location.image_url);
      if (!alreadyPresent) {
        list.unshift({
          id: -location.id,
          location_id: location.id,
          user_id: location.user_id,
          image_url: location.image_url,
          caption: null,
          mime_type: null,
          size_bytes: null,
          created_at: location.created_at,
        });
      }
    }
    return list;
  }, [photos, location]);
  const heroPhoto = orderedPhotos[0]?.image_url ?? null;
  const activeGalleryPhoto = orderedPhotos[selectedPhotoIndex]?.image_url ?? null;

  if (!isOpen || !location) {
    return null;
  }

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
        <div className="location-detail-hero">
          {heroPhoto ? <img src={heroPhoto} alt={location.name} /> : <div className="location-detail-hero__fallback">No image</div>}
        </div>
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
              {photosLoading ? <p>Loading photos...</p> : null}
              {!photosLoading && orderedPhotos.length === 0 ? <p>No photos yet.</p> : null}
              {activeGalleryPhoto ? (
                <div className="location-gallery-main">
                  <img src={activeGalleryPhoto} alt="Location gallery" loading="lazy" />
                </div>
              ) : null}
              <div className="location-gallery-strip">
                {orderedPhotos.map((photo, index) => (
                  <button key={photo.id} type="button" className={index === selectedPhotoIndex ? "active" : ""} onClick={() => setSelectedPhotoIndex(index)}>
                    <img src={photo.image_url} alt="Location thumbnail" loading="lazy" />
                  </button>
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
