import { useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { REVIEW_COMPOSE_LOTTIE_SRC, REVIEW_SUCCESS_LOTTIE_SRC } from "../../../shared/ui/lotties";

type ReviewFlowModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (rating: number, text: string | null) => Promise<void>;
};

export function ReviewFlowModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: ReviewFlowModalProps) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [step, setStep] = useState<"compose" | "success">("compose");
  const [localError, setLocalError] = useState<string | null>(null);

  const normalizedReviewText = useMemo(() => {
    const trimmed = reviewText.trim();
    return trimmed.length ? trimmed : null;
  }, [reviewText]);

  useEffect(() => {
    if (!isOpen) {
      setRating(5);
      setReviewText("");
      setStep("compose");
      setLocalError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== "success") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 2000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, onClose, step]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      setLocalError("Please select a rating from 1 to 5.");
      return;
    }

    try {
      setLocalError(null);
      await onSubmit(rating, normalizedReviewText);
      setStep("success");
    } catch {
      // Parent sets and displays the error message.
    }
  };

  return (
    <div className="onboarding-shell" role="dialog" aria-modal="true" aria-label="Add review">
      <section className="onboarding-panel onboarding-panel--form onboarding-panel--review" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="sheet-close review-flow-close" onClick={onClose} aria-label="Close review flow">
          <X size={16} />
        </button>

        {step === "compose" ? (
          <>
            <dotlottie-wc
              className="onboarding-lottie onboarding-lottie--review"
              src={REVIEW_COMPOSE_LOTTIE_SRC}
              autoplay
              loop
              aria-hidden="true"
            />
            <span className="onboarding-eyebrow">Share feedback</span>
            <h1>How was this place?</h1>
            <p>Leave a quick rating and an optional comment to help the next Bitcoiner.</p>
            <div className="star-input star-input--large" aria-label="Review rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className={value <= rating ? "active" : ""} aria-label={`${value} star`}>
                  <Star size={24} fill={value <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <textarea
              className="onboarding-input review-flow-textarea"
              placeholder="Write a short review"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              maxLength={600}
            />
            {localError ? <p className="onboarding-error">{localError}</p> : null}
            {error ? <p className="onboarding-error">{error}</p> : null}
            <button type="button" className="btn-primary onboarding-submit" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Sending..." : "Submit review"}
            </button>
          </>
        ) : (
          <>
            <dotlottie-wc
              className="onboarding-lottie onboarding-lottie--review-success"
              src={REVIEW_SUCCESS_LOTTIE_SRC}
              autoplay
              loop
              aria-hidden="true"
            />
            <span className="onboarding-eyebrow">Review added</span>
            <h1>Thanks for the feedback</h1>
            <p>Your review is now live. This closes automatically in a moment.</p>
          </>
        )}
      </section>
    </div>
  );
}
