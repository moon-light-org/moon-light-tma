import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type OnboardingFlowProps = {
  initialName?: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmitNickname: (nickname: string) => Promise<void>;
  onComplete: () => void;
};

export function OnboardingFlow({
  initialName,
  isSubmitting,
  error,
  onSubmitNickname,
  onComplete,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState(initialName ?? "");
  const trimmedNickname = useMemo(() => nickname.trim(), [nickname]);

  const welcomeName = trimmedNickname || initialName?.trim() || "friend";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (trimmedNickname.length < 2 || isSubmitting) {
      return;
    }
    try {
      await onSubmitNickname(trimmedNickname);
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
          <p>Welcome to Moonlight. Tap to continue.</p>
        </button>
      )}

      {step === 2 && (
        <form className="onboarding-panel onboarding-panel--form" onSubmit={(event) => void handleSubmit(event)}>
          <h1>Pick your nickname</h1>
          <p>This is how others will see you.</p>
          <input
            className="onboarding-input"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Your nickname"
            autoFocus
            maxLength={24}
          />
          {error && <p className="onboarding-error">{error}</p>}
          <button
            type="submit"
            className="btn-primary onboarding-submit"
            disabled={trimmedNickname.length < 2 || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Submit"}
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
