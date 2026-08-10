import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { CreateLocationReportPayload, CreateLocationReviewPayload, Location, LocationPhoto, LocationReview } from "../../../entities/location/model/types";
import { ReviewFlowModal } from "./ReviewFlowModal";
import { ReportFlowModal } from "./ReportFlowModal";

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
  onCreateReview: (payload: CreateLocationReviewPayload) => Promise<void>;
  onCreateReport: (payload: CreateLocationReportPayload) => Promise<void>;
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
  onCreateReport,
}: LocationDetailSheetProps) {
  const [tab, setTab] = useState<TabKey>("description");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isReviewFlowOpen, setIsReviewFlowOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReportFlowOpen, setIsReportFlowOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!isOpen) {
      setIsReviewFlowOpen(false);
      setIsReportFlowOpen(false);
      setIsSubmittingReview(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !location) {
    return null;
  }

  const handleSubmitReview = async (payload: CreateLocationReviewPayload) => {
    try {
      setError(null);
      setIsSubmittingReview(true);
      await onCreateReview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add review");
      throw err;
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const handleSubmitReport = async (payload: CreateLocationReportPayload) => {
    try { setError(null); setIsSubmittingReport(true); await onCreateReport(payload); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to report location"); throw err; }
    finally { setIsSubmittingReport(false); }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Location details">
      <div className="bottom-sheet location-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="location-detail-hero">
          {heroPhoto ? <img src={heroPhoto} alt={location.name} /> : <div className="location-detail-hero__skeleton" aria-hidden="true" />}
        </div>
        <div className="sheet-header">
          <h3>{location.name}</h3>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="sheet-coords">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>

        <div className="location-detail-tabs" role="tablist" aria-label="Location detail tabs">
          <button type="button" className={tab === "description" ? "active" : ""} onClick={() => setTab("description")}>
            Description
          </button>
          <button type="button" className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")}>
            Photos
          </button>
          <button type="button" className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>
            Comments
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
            <div className="location-detail-review-section">
              <section className="location-detail-review-card">
                <span className="location-detail-review-label">Community feedback</span>
                <h4 className="location-detail-section-title">Comments from other users</h4>
                <p className="location-detail-review-copy">See what other Bitcoiners are saying before you add your own take.</p>
                <div className="location-detail-review-summary">
                  <div className="location-detail-review-stat">
                    <strong>{reviews.length}</strong>
                    <span>{reviews.length === 1 ? "Comment" : "Comments"}</span>
                  </div>
                </div>
                <div className="location-detail-contribution-actions">
                  <button type="button" className="btn-primary location-detail-review-trigger" disabled={!canContribute} onClick={() => setIsReviewFlowOpen(true)}>
                    Add comment
                  </button>
                  <button type="button" className="btn-secondary location-detail-review-trigger" disabled={!canContribute} onClick={() => setIsReportFlowOpen(true)}>
                    Report location
                  </button>
                </div>
              </section>

              <div className="location-detail-toolbar">
                <h5 className="location-detail-list-title">Latest comments</h5>
              </div>
              {reviewsLoading ? <p>Loading comments...</p> : null}
              {!reviewsLoading && reviews.length === 0 ? <p className="location-detail-review-empty">No comments yet.</p> : null}
              <div className="location-review-list">
                {reviews.map((review) => (
                  <article key={review.id} className="location-review-item">
                    <strong>{review.source === "btcmap" ? "BTCMap comment" : review.payment_status === "lightning" ? "Accepts Lightning" : review.payment_status === "btc_only" ? "Accepts only BTC" : review.payment_status === "neither" ? "Accepts neither Lightning nor BTC" : "User review"}</strong>
                    {review.wallet ? <p className="muted">Wallet: {review.wallet.replaceAll("_", " ")}</p> : null}
                    {review.rating !== null ? <p>Place rating: {review.rating}/3</p> : null}
                    {review.text ? <p>{review.text}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="location-detail-error">{error}</p> : null}
        </div>

        <ReviewFlowModal
          isOpen={isReviewFlowOpen}
          isSubmitting={isSubmittingReview}
          error={error}
          onClose={() => {
            setIsReviewFlowOpen(false);
            setError(null);
          }}
          onSubmit={handleSubmitReview}
        />
        <ReportFlowModal
          isOpen={isReportFlowOpen}
          isSubmitting={isSubmittingReport}
          error={error}
          onClose={() => { setIsReportFlowOpen(false); setError(null); }}
          onSubmit={handleSubmitReport}
        />
      </div>
    </div>
  );
}
