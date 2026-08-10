import { useEffect, useEffectEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import type { CreateLocationReviewPayload } from "../../../entities/location/model/types";
import { REVIEW_SUCCESS_LOTTIE_SRC } from "../../../shared/ui/lotties";

type ReviewFlowModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateLocationReviewPayload) => Promise<void>;
};

export function ReviewFlowModal({ isOpen, isSubmitting, error, onClose, onSubmit }: ReviewFlowModalProps) {
  const [step, setStep] = useState<"comment" | "success">("comment");
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const close = () => {
    setStep("comment");
    setText("");
    setLocalError(null);
    onClose();
  };
  const closeAfterSuccess = useEffectEvent(close);

  useEffect(() => {
    if (!isOpen || step !== "success") return;
    const timeoutId = window.setTimeout(closeAfterSuccess, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    headingRef.current?.focus();
  }, [isOpen, step]);

  if (!isOpen) return null;

  const submit = async () => {
    const comment = text.trim();
    if (!comment) {
      setLocalError("Comment text is required.");
      return;
    }
    try {
      setLocalError(null);
      await onSubmit({ paymentStatus: null, wallet: null, rating: null, text: comment });
      setStep("success");
    } catch {
      // The parent renders request errors.
    }
  };

  return <div className="onboarding-shell" role="dialog" aria-modal="true" aria-label="Add comment">
    <section className="onboarding-panel onboarding-panel--form onboarding-panel--review" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="sheet-close review-flow-close" disabled={isSubmitting} onClick={close} aria-label="Close comment flow"><X size={16} /></button>
      {step === "comment" ? <><span className="onboarding-eyebrow">Comment</span><h1 ref={headingRef} tabIndex={-1}>Add a comment</h1><p>Share a short note about this place.</p>
        <textarea className="onboarding-input review-flow-textarea" disabled={isSubmitting} placeholder="Write a short comment" value={text} onChange={(event) => setText(event.target.value)} maxLength={600} />
        <div className="review-flow-navigation"><button type="button" className="btn-primary review-flow-forward" disabled={isSubmitting} onClick={() => void submit()}>{isSubmitting ? "Sending..." : "Submit comment"}</button></div></> : null}
      {step === "success" ? <><dotlottie-wc className="onboarding-lottie onboarding-lottie--review-success" src={REVIEW_SUCCESS_LOTTIE_SRC} autoplay loop aria-hidden="true" /><span className="onboarding-eyebrow">Comment added</span><h1 ref={headingRef} tabIndex={-1}>Thanks for the feedback</h1><p>Your comment is now live. This closes automatically in a moment.</p></> : null}
      {localError ? <p className="onboarding-error">{localError}</p> : null}{error ? <p className="onboarding-error">{error}</p> : null}
    </section>
  </div>;
}
