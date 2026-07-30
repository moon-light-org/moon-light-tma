import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Star, X } from "lucide-react";
import type { CreateLocationReviewPayload, LocationPaymentStatus, LocationWallet } from "../../../entities/location/model/types";
import { REVIEW_SUCCESS_LOTTIE_SRC } from "../../../shared/ui/lotties";

type ReviewFlowModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateLocationReviewPayload) => Promise<void>;
};

const paymentOptions: { value: LocationPaymentStatus; label: string }[] = [
  { value: "lightning", label: "Accepts Lightning" },
  { value: "btc_only", label: "Accepts only BTC" },
  { value: "neither", label: "Accepts neither Lightning nor BTC" },
];
const walletOptions: { value: LocationWallet; label: string }[] = [
  { value: "wallet_of_satoshi", label: "Wallet of Satoshi" }, { value: "muun", label: "Muun" },
  { value: "breez", label: "Breez" }, { value: "blw", label: "BLW" }, { value: "eclair", label: "Eclair" },
  { value: "zap", label: "Zap" }, { value: "phoenix", label: "Phoenix" }, { value: "blue_wallet", label: "Blue Wallet" },
  { value: "other", label: "Other" },
];
const ratingOptions = [
  { value: 0, label: "0", copy: "Lightning only, no other benefit" },
  { value: 1, label: "1", copy: "Decent service or 10% promo" },
  { value: 2, label: "2", copy: "Decent service and 10-20% promo" },
  { value: 3, label: "3", copy: "Excellent service and promo, or decent service with more than 20% promo" },
];

export function ReviewFlowModal({ isOpen, isSubmitting, error, onClose, onSubmit }: ReviewFlowModalProps) {
  const [step, setStep] = useState<"payment" | "wallet" | "rating" | "comment" | "success">("payment");
  const [paymentStatus, setPaymentStatus] = useState<LocationPaymentStatus | null>(null);
  const [wallet, setWallet] = useState<LocationWallet | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingDescription, setRatingDescription] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const close = () => {
    setStep("payment"); setPaymentStatus(null); setWallet(null); setRating(null); setRatingDescription(null); setText(""); setLocalError(null); onClose();
  };
  const closeAfterSuccess = useEffectEvent(close);
  useEffect(() => {
    if (!isOpen || step !== "success") return;
    const timeoutId = window.setTimeout(closeAfterSuccess, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, step]);
  useEffect(() => {
    if (!isOpen) return;
    stepHeadingRef.current?.focus();
  }, [isOpen, step]);

  if (!isOpen) return null;
  const submit = async (comment = text.trim() || null) => {
    if (!paymentStatus) { setLocalError("Choose the payment status to submit."); return; }
    try {
      setLocalError(null);
      await onSubmit({ paymentStatus, wallet, rating, text: comment });
      setStep("success");
    } catch { /* The parent renders request errors. */ }
  };
  const chooseRating = (option: typeof ratingOptions[number]) => {
    setRating(option.value);
    setRatingDescription(option.copy);
  };
  const goBack = (previousStep: "payment" | "wallet" | "rating") => {
    setLocalError(null);
    setStep(previousStep);
  };

  return <div className="onboarding-shell" role="dialog" aria-modal="true" aria-label="Add review">
    <section className="onboarding-panel onboarding-panel--form onboarding-panel--review" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="sheet-close review-flow-close" disabled={isSubmitting} onClick={close} aria-label="Close review flow"><X size={16} /></button>
      {step === "payment" ? <><span className="onboarding-eyebrow">Step 1 of 4</span><h1 ref={stepHeadingRef} tabIndex={-1}>Payment status</h1><p>How can you pay at this place?</p>
        {paymentOptions.map((option) => <button key={option.value} type="button" disabled={isSubmitting} className={`btn-secondary ${paymentStatus === option.value ? "active" : ""}`} onClick={() => { setPaymentStatus(option.value); setStep("wallet"); }}>{option.label}</button>)}</> : null}
      {step === "wallet" ? <><span className="onboarding-eyebrow">Step 2 of 4</span><h1 ref={stepHeadingRef} tabIndex={-1}>Which wallet did you use?</h1><p>This is optional.</p>
        <div className="review-flow-wallet-options">{walletOptions.map((option) => <button key={option.value} type="button" disabled={isSubmitting} className={`btn-secondary ${wallet === option.value ? "active" : ""}`} onClick={() => { setWallet(option.value); setStep("rating"); }}>{option.label}</button>)}</div>
        <div className="review-flow-navigation"><button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => goBack("payment")}>Back</button><button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => { setWallet(null); setStep("rating"); }}>Skip</button></div></> : null}
      {step === "rating" ? <><span className="onboarding-eyebrow">Step 3 of 4</span><h1 ref={stepHeadingRef} tabIndex={-1}>Rate the benefit</h1><p>This is optional.</p>
        <div className="review-flow-stars" aria-label="Benefit rating">{ratingOptions.map((option) => <button key={option.value} type="button" disabled={isSubmitting} className={`review-flow-star ${rating !== null && option.value <= rating ? "active" : ""}`} onClick={() => chooseRating(option)} aria-label={`Rate ${option.value}: ${option.copy}`} aria-pressed={rating === option.value}><Star size={32} fill={rating !== null && option.value <= rating ? "currentColor" : "none"} aria-hidden="true" /></button>)}</div>
        {ratingDescription ? <p className="review-flow-rating-description" aria-live="polite">{ratingDescription}</p> : null}
        <div className="review-flow-navigation"><button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => goBack("wallet")}>Back</button>{rating === null ? <button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => { setRating(null); setRatingDescription(null); setStep("comment"); }}>Skip</button> : <button type="button" className="btn-primary" disabled={isSubmitting} onClick={() => setStep("comment")}>Next</button>}</div></> : null}
      {step === "comment" ? <><span className="onboarding-eyebrow">Step 4 of 4</span><h1 ref={stepHeadingRef} tabIndex={-1}>Add a comment</h1><p>This is optional.</p>
        <textarea className="onboarding-input review-flow-textarea" disabled={isSubmitting} placeholder="Write a short review" value={text} onChange={(event) => setText(event.target.value)} maxLength={600} />
        <button type="button" className="btn-primary onboarding-submit" disabled={isSubmitting} onClick={() => void submit()}>{isSubmitting ? "Sending..." : "Submit review"}</button><div className="review-flow-navigation"><button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => goBack("rating")}>Back</button><button type="button" className="btn-secondary" disabled={isSubmitting} onClick={() => { setText(""); void submit(null); }}>Skip</button></div></> : null}
      {step === "success" ? <><dotlottie-wc className="onboarding-lottie onboarding-lottie--review-success" src={REVIEW_SUCCESS_LOTTIE_SRC} autoplay loop aria-hidden="true" /><span className="onboarding-eyebrow">Review added</span><h1 ref={stepHeadingRef} tabIndex={-1}>Thanks for the feedback</h1><p>Your review is now live. This closes automatically in a moment.</p></> : null}
      {localError ? <p className="onboarding-error">{localError}</p> : null}{error ? <p className="onboarding-error">{error}</p> : null}
    </section>
  </div>;
}
