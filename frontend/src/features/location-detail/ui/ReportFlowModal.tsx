import { useEffect, useEffectEvent, useState } from "react";
import { X } from "lucide-react";
import type { CreateLocationReportPayload, LocationReportReason } from "../../../entities/location/model/types";

type ReportFlowModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateLocationReportPayload) => Promise<void>;
};

const reasons: { value: LocationReportReason; label: string }[] = [
  { value: "missing", label: "Location doesn't exist" }, { value: "no_lightning_or_btc", label: "Doesn't accept Lightning and BTC" },
  { value: "illegal_service", label: "Illegal service" }, { value: "poor_service", label: "Poor quality service" }, { value: "other", label: "Other" },
];

export function ReportFlowModal({ isOpen, isSubmitting, error, onClose, onSubmit }: ReportFlowModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<LocationReportReason[]>([]);
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const close = () => { setSelectedReasons([]); setText(""); setLocalError(null); setSuccess(false); onClose(); };
  const closeAfterSuccess = useEffectEvent(close);
  useEffect(() => { if (!success) return; const id = window.setTimeout(closeAfterSuccess, 2000); return () => window.clearTimeout(id); }, [success]);
  if (!isOpen) return null;
  const toggle = (reason: LocationReportReason) => setSelectedReasons((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]);
  const submit = async () => {
    if (!selectedReasons.length) { setLocalError("Select at least one reason."); return; }
    try { setLocalError(null); await onSubmit({ reasons: selectedReasons, text: text.trim() || null }); setSuccess(true); } catch { /* The parent renders request errors. */ }
  };
  return <div className="onboarding-shell" role="dialog" aria-modal="true" aria-label="Report location"><section className="onboarding-panel onboarding-panel--form onboarding-panel--review" onClick={(event) => event.stopPropagation()}>
    <button type="button" className="sheet-close review-flow-close" onClick={close} aria-label="Close report flow"><X size={16} /></button>
    {success ? <><span className="onboarding-eyebrow">Report sent</span><h1>Thanks for letting us know</h1><p>Your report has been submitted.</p></> : <><span className="onboarding-eyebrow">Report location</span><h1>What is wrong with this place?</h1><p>Select every reason that applies.</p>
      {reasons.map((reason) => <label key={reason.value} className={`btn-secondary report-flow-reason ${selectedReasons.includes(reason.value) ? "active" : ""}`}><input type="checkbox" checked={selectedReasons.includes(reason.value)} onChange={() => toggle(reason.value)} /> <span>{reason.label}</span></label>)}
      <textarea className="onboarding-input review-flow-textarea" placeholder="Add details (optional)" value={text} onChange={(event) => setText(event.target.value)} maxLength={600} />
      <button type="button" className="btn-primary onboarding-submit" disabled={isSubmitting || selectedReasons.length === 0} onClick={submit}>{isSubmitting ? "Sending..." : "Submit report"}</button></>}
    {localError ? <p className="onboarding-error">{localError}</p> : null}{error ? <p className="onboarding-error">{error}</p> : null}
  </section></div>;
}
