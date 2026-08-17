import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, ShieldAlert, X } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../../entities/location/model/mainCategories";
import type { CreateLocationReportPayload, CreateLocationReviewPayload, Location, LocationPhoto, LocationReview } from "../../../entities/location/model/types";
import { ReviewFlowModal } from "./ReviewFlowModal";
import { ReportFlowModal } from "./ReportFlowModal";

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

function getReviewTitle(review: LocationReview): string {
  if (review.source === "btcmap") return "BTCMap review";
  if (review.payment_status === "lightning") return "Accepts Lightning";
  if (review.payment_status === "btc_only") return "Accepts only BTC";
  if (review.payment_status === "neither") return "Accepts neither Lightning nor BTC";
  return "User review";
}

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  const diffDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
}

function renderStars(rating: number | null) {
  if (rating === null) return null;
  const filled = Math.max(0, Math.min(5, rating === 0 ? 0 : Math.round((rating / 3) * 5)));
  return <span className="location-review-carousel-card__stars" aria-label={`${rating} out of 3 rating`}>{"★".repeat(filled)}{"☆".repeat(5 - filled)}</span>;
}

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
  const [isReviewFlowOpen, setIsReviewFlowOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReportFlowOpen, setIsReportFlowOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
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
  const category = MAIN_CATEGORY_BY_VALUE[location?.main_category ?? "other"];
  const CategoryIcon = category.Icon;

  useEffect(() => {
    if (!isOpen) {
      setIsReviewFlowOpen(false);
      setIsReportFlowOpen(false);
      setIsSubmittingReview(false);
      setShowAllReviews(false);
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
        <div className="sheet-header location-detail-header">
          <div className="location-detail-title">
            <h3>{location.name}</h3>
            <div className="location-detail-badges">
              <span className="location-detail-category"><CategoryIcon size={14} />{category.label}</span>
              <span className={`location-detail-verification ${location.is_approved ? "is-verified" : "is-unverified"}`}>
                {location.is_approved ? <BadgeCheck size={14} /> : <ShieldAlert size={14} />}
                {location.is_approved ? "Verified" : "Not verified"}
              </span>
            </div>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="sheet-coords">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>

        <div className="sheet-body location-detail-body">
          <section className="location-detail-section location-detail-description-card">
            <div className="location-detail-section-heading">
              <h4>Description</h4>
            </div>
            <div className="location-detail-description">
              <p>{location.description?.trim() || "No description yet."}</p>
              <div className="location-detail-facts">
                {location.address ? <p><strong>Address</strong><span>{location.address}</span></p> : null}
                {location.phone ? <p><strong>Phone</strong><a href={`tel:${location.phone}`}>{location.phone}</a></p> : null}
                {location.schedules ? <p><strong>Hours</strong><span>{location.schedules}</span></p> : null}
                {location.accepts_bitcoin !== null || location.accepts_lightning !== null ? (
                  <p>
                    <strong>Payments</strong>
                    <span>{[
                      location.accepts_bitcoin ? "Bitcoin" : null,
                      location.accepts_lightning ? "Lightning" : null,
                    ].filter(Boolean).join(" + ") || "Bitcoin support not confirmed"}</span>
                  </p>
                ) : null}
              </div>
              {location.website_url ? (
                <a className="location-card__link" href={location.website_url} target="_blank" rel="noreferrer">
                  Visit website
                </a>
              ) : null}
            </div>
          </section>

          {photosLoading || orderedPhotos.length > 0 ? (
            <section className="location-detail-section location-detail-photos-section">
              <div className="location-detail-section-heading">
                <h4>Photos</h4>
              </div>
              {photosLoading ? <p>Loading photos...</p> : null}
              <div className="location-photo-carousel" aria-label="Location photos">
                {orderedPhotos.map((photo, index) => (
                  <div key={photo.id} className="location-photo-carousel-card" aria-label={`Photo ${index + 1}`}>
                    <img src={photo.image_url} alt="Location" loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="location-detail-section location-detail-review-section">
              <div className="location-detail-review-heading">
                <h4>Reviews</h4>
              </div>
              {reviewsLoading ? <p>Loading reviews...</p> : null}
              {!reviewsLoading && reviews.length === 0 ? <p className="location-detail-review-empty">No reviews yet.</p> : null}
              {reviews.length > 0 ? (
                <>
                  <div className="location-review-carousel" aria-label="Reviews carousel">
                    {reviews.slice(0, 8).map((review) => (
                      <article key={review.id} className="location-review-carousel-card">
                        <div className="location-review-carousel-card__head">
                          <span className="location-review-carousel-card__avatar">{review.source === "btcmap" ? "B" : "U"}</span>
                          <strong>{getReviewTitle(review)}</strong>
                        </div>
                        <div className="location-review-carousel-card__meta">
                          {renderStars(review.rating)}
                          <span>{formatReviewDate(review.created_at)}</span>
                        </div>
                        {review.wallet ? <p className="muted">Wallet: {review.wallet.replaceAll("_", " ")}</p> : null}
                        <p className="location-review-carousel-card__text">{review.text || "No text review."}</p>
                      </article>
                    ))}
                  </div>
                  <button type="button" className="location-review-see-all" onClick={() => setShowAllReviews((value) => !value)}>
                    {showAllReviews ? "Hide reviews" : "See all reviews"}
                    <span aria-hidden="true">›</span>
                  </button>
                </>
              ) : null}
              {showAllReviews ? (
                <div className="location-review-list location-review-list--expanded">
                  {reviews.map((review) => (
                    <article key={review.id} className="location-review-item">
                      <strong>{getReviewTitle(review)}</strong>
                      <div className="location-review-item__meta">
                        {renderStars(review.rating)}
                        <span>{formatReviewDate(review.created_at)}</span>
                      </div>
                      {review.wallet ? <p className="muted">Wallet: {review.wallet.replaceAll("_", " ")}</p> : null}
                      {review.text ? <p>{review.text}</p> : <p className="muted">No text review.</p>}
                    </article>
                  ))}
                </div>
              ) : null}
              <div className="location-detail-review-actions">
                <button type="button" className="btn-secondary location-detail-review-add" disabled={!canContribute} onClick={() => setIsReviewFlowOpen(true)}>
                  Add review
                </button>
                <button type="button" className="location-detail-report-link" disabled={!canContribute} onClick={() => setIsReportFlowOpen(true)}>
                  Report location
                </button>
              </div>
          </section>

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
