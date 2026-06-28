import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type OnboardingFlowProps = {
  defaultNickname: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmitNickname: (nickname: string) => Promise<void>;
  onSkip: () => Promise<void>;
  onComplete: () => void;
};

export function OnboardingFlow({
  defaultNickname,
  isSubmitting,
  error,
  onSubmitNickname,
  onSkip,
  onComplete,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const trimmedNickname = useMemo(() => nickname.trim(), [nickname]);

  const welcomeName = trimmedNickname || defaultNickname;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (trimmedNickname.length < 2 || isSubmitting) {
      setLocalError("Nickname must be at least 2 characters.");
      return;
    }
    try {
      setLocalError(null);
      await onSubmitNickname(trimmedNickname);
      setStep(3);
    } catch {
      // Parent sets and displays the error message.
    }
  }

  async function handleSkip() {
    if (isSubmitting) {
      return;
    }
    try {
      setLocalError(null);
      await onSkip();
      setStep(3);
    } catch {
      // Parent sets and displays the error message.
    }
  }

  return (
    <div className="onboarding-shell">
      {step === 1 && (
        <button type="button" className="onboarding-panel" onClick={() => setStep(2)}>
          <div className="onboarding-blob" aria-hidden="true" />
          <h1>Hello there</h1>
          <p>Welcome to MoonLight. Pick a public nickname or stay anonymous.</p>
        </button>
      )}

      {step === 2 && (
        <form className="onboarding-panel onboarding-panel--form" onSubmit={(event) => void handleSubmit(event)}>
          <h1>Pick your nickname</h1>
          <p>This is how others will see you. You can skip and use {defaultNickname}.</p>
          <input
            className="onboarding-input"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Your nickname"
            autoFocus
            maxLength={32}
          />
          {localError && <p className="onboarding-error">{localError}</p>}
          {error && <p className="onboarding-error">{error}</p>}
          <button
            type="submit"
            className="btn-primary onboarding-submit"
            disabled={trimmedNickname.length < 2 || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
          <button
            type="button"
            className="onboarding-submit"
            disabled={isSubmitting}
            onClick={() => void handleSkip()}
          >
            Skip for now
          </button>
        </form>
      )}

      {step === 3 && (
        <button type="button" className="onboarding-panel" onClick={onComplete}>
          <h1>Welcome, {welcomeName}</h1>
          <p>Tap to enter the map.</p>
        </button>
      )}
    </div>
  );
}
