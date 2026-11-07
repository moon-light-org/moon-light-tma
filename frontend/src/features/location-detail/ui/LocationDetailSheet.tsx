import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Bitcoin, Clock3, Copy, CreditCard, ExternalLink, Flag, Map, MapPin, MapPinCheck, MessageSquarePlus, Phone, ShieldAlert, X, Zap } from "lucide-react";
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
  /** "page" renders full-screen with a back button, for the map-less discover flow. */
  variant?: "sheet" | "page";
  onClose: () => void;
  onShowOnMap?: () => void;
  onCreateReview: (payload: CreateLocationReviewPayload) => Promise<void>;
  onCreateReport: (payload: CreateLocationReportPayload) => Promise<void>;
  onCheckIn: () => Promise<void>;
};

const REVIEW_TITLE_MAX_LENGTH = 42;

/** Uses the opening phrase of the comment as the title, trimmed with an ellipsis. */
function getReviewTitle(review: LocationReview): string {
  const text = review.text?.trim().replace(/\s+/g, " ") ?? "";
  if (text) {
    const [firstPhrase] = text.split(/(?<=[.!?])\s|\s[–—-]\s/);
    const phrase = (firstPhrase ?? text).trim();
    const truncated = phrase.length > REVIEW_TITLE_MAX_LENGTH
      ? phrase.slice(0, REVIEW_TITLE_MAX_LENGTH)
      : phrase;
    if (truncated.length < text.length) {
      return `${truncated.replace(/[\s.,;:!?]+$/, "")}…`;
    }
    return truncated;
  }

  if (review.source === "btcmap") return "BTCMap review";
  if (review.payment_status === "lightning") return "Accepts Lightning";
  if (review.payment_status === "btc_only") return "Accepts only BTC";
  if (review.payment_status === "neither") return "Accepts neither Lightning nor BTC";
  return "User review";
}

function getReviewInitial(review: LocationReview): string {
  const nickname = review.user_nickname?.trim();
  if (nickname) return nickname.charAt(0).toUpperCase();
  return review.source === "btcmap" ? "B" : "U";
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
  const filled = Math.max(0, Math.min(3, Math.round(rating)));
  return <span className="location-review-carousel-card__stars" aria-label={`${rating} out of 3 rating`}>{"★".repeat(filled)}{"☆".repeat(3 - filled)}</span>;
}

export function LocationDetailSheet({
  isOpen,
  location,
  photos,
  reviews,
  photosLoading,
  reviewsLoading,
  canContribute,
  variant = "sheet",
  onClose,
  onShowOnMap,
  onCreateReview,
  onCreateReport,
  onCheckIn,
}: LocationDetailSheetProps) {
  const [isReviewFlowOpen, setIsReviewFlowOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReportFlowOpen, setIsReportFlowOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const orderedPhotos = useMemo(() => {
    const list = [...photos];
    if (location?.image_url && !location.image_url.includes("/category-defaults/")) {
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
  const heroPhoto = orderedPhotos[0]?.image_url ?? location?.image_url ?? null;
  const isCategoryImage = heroPhoto?.includes("/category-defaults/") ?? false;
  const category = MAIN_CATEGORY_BY_VALUE[location?.main_category ?? "other"];
  const CategoryIcon = category.Icon;
  const ratedReviews = reviews.filter((review) => review.rating !== null);
  const averageRating = ratedReviews.length
    ? (ratedReviews.reduce((total, review) => total + (review.rating ?? 0), 0) / ratedReviews.length).toFixed(1)
    : null;

  useEffect(() => {
    if (!isOpen) {
      setIsReviewFlowOpen(false);
      setIsReportFlowOpen(false);
      setIsSubmittingReview(false);
      setShowAllReviews(false);
      setError(null);
      setCheckInMessage(null);
      setHasCheckedIn(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setCheckInMessage(null);
    setHasCheckedIn(false);
  }, [location?.id]);

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

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setCheckInMessage(null);
    try {
      await onCheckIn();
      setHasCheckedIn(true);
      setCheckInMessage("Check-in confirmed. Thanks for visiting!");
    } catch (err) {
      setCheckInMessage(err instanceof Error ? err.message : "Could not check in. Try again.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const isPage = variant === "page";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;

  const body = (
      <div
        className={`bottom-sheet location-detail-sheet${isPage ? " location-detail-sheet--page" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isPage ? null : <div className="sheet-handle" />}
        <div className="location-detail-summary">
          <div className="sheet-header location-detail-header">
            {isPage ? <button type="button" className="sheet-close" onClick={onClose} aria-label="Back to list"><ArrowLeft size={18} /></button> : null}
            <div className="location-detail-title">
              <h3>{location.name}</h3>
            </div>
            {!isPage ? <button type="button" className="sheet-close" onClick={onClose} aria-label="Close"><X size={16} /></button> : null}
          </div>
          <div className="location-detail-badges">
            <span className="location-detail-category"><CategoryIcon size={16} />{category.label}</span>
            {location.accepts_lightning ? <span className="location-detail-payment-badge"><Zap size={16} />Lightning</span> : null}
            {location.accepts_bitcoin ? <span className="location-detail-payment-badge"><Bitcoin size={16} />On-chain BTC</span> : null}
            <span className={`location-detail-verification ${location.is_approved ? "is-verified" : "is-unverified"}`}>
              {location.is_approved ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
              {location.is_approved ? "Verified" : "Not verified"}
            </span>
          </div>
        </div>

        <div className="sheet-body location-detail-body">
          <div className={`location-detail-hero${heroPhoto ? " location-detail-hero--photo" : " location-detail-hero--empty"}`}>
            {heroPhoto ? <img src={heroPhoto} alt={isCategoryImage ? `${category.label} category illustration` : location.name} /> : <span className="location-detail-hero__icon" aria-hidden="true"><CategoryIcon size={28} strokeWidth={1.5} /></span>}
          </div>
          <section className="location-detail-section location-detail-check-in" aria-label="Check in">
            <span className="location-detail-check-in__icon" aria-hidden="true"><MapPinCheck size={22} /></span>
            <div className="location-detail-check-in__copy">
              <strong>Check in at this place</strong>
              <p>Available when you are within 100 m.</p>
            </div>
            <button type="button" className="btn-primary" disabled={!canContribute || isCheckingIn || hasCheckedIn} onClick={handleCheckIn}>
              {isCheckingIn ? "Checking…" : hasCheckedIn ? "Checked in" : "Check in"}
            </button>
            {!canContribute ? <p className="location-detail-check-in__message">Open MoonLight in Telegram and create a profile to check in.</p> : null}
            {checkInMessage ? <p className="location-detail-check-in__message" role="status">{checkInMessage}</p> : null}
            {hasCheckedIn ? <button type="button" className="location-detail-check-in__review" onClick={() => setIsReviewFlowOpen(true)}>Review this place</button> : null}
          </section>
          <section className="location-detail-section location-detail-description-card">
            <div className="location-detail-section-heading">
              <h4>Business details</h4>
            </div>
            <div className="location-detail-description">
              <p>{location.description?.trim() || "No description yet."}</p>
              <div className="location-detail-facts">
                {location.address ? <div className="location-detail-fact"><MapPin size={18} /><div><strong>Address</strong><span>{location.address}</span></div><button type="button" aria-label="Copy address" onClick={() => { void navigator.clipboard?.writeText(location.address ?? ""); }}><Copy size={17} /></button></div> : null}
                {location.phone ? <div className="location-detail-fact"><Phone size={18} /><div><strong>Phone</strong><span>{location.phone}</span></div><a href={`tel:${location.phone}`}>Call</a></div> : null}
                {location.schedules ? <div className="location-detail-fact"><Clock3 size={18} /><div><strong>Hours</strong><span>{location.schedules}</span></div></div> : null}
                {location.accepts_bitcoin !== null || location.accepts_lightning !== null ? (
                  <div className="location-detail-fact"><CreditCard size={18} /><div>
                    <strong>Payments</strong><span>{[
                      location.accepts_bitcoin ? "Bitcoin" : null,
                      location.accepts_lightning ? "Lightning" : null,
                    ].filter(Boolean).join(" + ") || "Bitcoin support not confirmed"}</span></div>
                  </div>
                ) : null}
              </div>
              {location.website_url ? (
                <a className="location-detail-website" href={location.website_url} target="_blank" rel="noreferrer">
                  Visit website
                </a>
              ) : null}
              <div className="location-detail-map-actions">
                {onShowOnMap ? <button type="button" className="location-detail-map-link" onClick={onShowOnMap}><Map size={16} />Show on map</button> : null}
                <a className="location-detail-map-link" href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} />Open in Google Maps</a>
              </div>
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
                <h4>Reviews <span>{reviews.length}</span></h4>
                {averageRating ? <p aria-label={`Average rating ${averageRating} out of 3`}>★ {averageRating} / 3.0</p> : null}
              </div>
              {reviewsLoading ? <p>Loading reviews...</p> : null}
              {!reviewsLoading && reviews.length === 0 ? <p className="location-detail-review-empty">No reviews yet.</p> : null}
              {reviews.length > 0 ? (
                <>
                  <div className="location-review-carousel" aria-label="Recent reviews">
                    {reviews.slice(0, 2).map((review) => (
                      <article key={review.id} className="location-review-carousel-card">
                        <div className="location-review-carousel-card__head">
                          <span className="location-review-carousel-card__avatar">{getReviewInitial(review)}</span>
                          <strong>{review.user_nickname || (review.source === "btcmap" ? "BTCMap visitor" : "MoonLight visitor")}</strong>
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
                  {reviews.length > 2 ? <button type="button" className="location-review-see-all" onClick={() => setShowAllReviews((value) => !value)}>
                    {showAllReviews ? "Show fewer reviews" : `See all ${reviews.length} reviews`}
                    <span aria-hidden="true">›</span>
                  </button> : null}
                </>
              ) : null}
              {showAllReviews ? (
                <div className="location-review-list location-review-list--expanded">
                  {reviews.slice(2).map((review) => (
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
                  <MessageSquarePlus size={17} /> Add review
                </button>
                <button type="button" className="location-detail-report-link" disabled={!canContribute} onClick={() => setIsReportFlowOpen(true)}>
                  <Flag size={17} /> Report location
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
  );

  if (isPage) {
    return (
      <section className="location-detail-page" role="dialog" aria-modal="true" aria-label="Location details">
        {body}
      </section>
    );
  }

  return (
    <div className="sheet-backdrop location-detail-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Location details">
      {body}
    </div>
  );
}
