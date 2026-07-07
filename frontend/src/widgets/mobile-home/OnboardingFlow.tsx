import { useMemo, useState } from "react";
import type { FormEvent } from "react";

const HELLO_LOTTIE_SRC = "https://lottie.host/06b95c48-33c1-4edd-94ec-1e9d168c2f30/hhj7Rgkswv.lottie";
const WELCOME_LOTTIE_SRC = "https://lottie.host/42ada56a-0e51-475b-a58e-4f64382f33ce/ufM6EL4mVR.lottie";

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
          <dotlottie-wc
            className="onboarding-lottie onboarding-lottie--hello"
            src={HELLO_LOTTIE_SRC}
            autoplay
            loop
            aria-hidden="true"
          />
          <h1>Hello there</h1>
          <p>Welcome to MoonLight. Pick a public nickname or stay anonymous.</p>
        </button>
      )}

      {step === 2 && (
        <form className="onboarding-panel onboarding-panel--form onboarding-panel--nickname" onSubmit={(event) => void handleSubmit(event)}>
          <span className="onboarding-eyebrow">Public profile</span>
          <h1>Choose your name</h1>
          <p>Keep it short and recognizable. You can change it later from your profile.</p>
          <input
            className="onboarding-input"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder={defaultNickname}
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
            {isSubmitting ? "Saving..." : "Continue"}
          </button>
          <button
            type="button"
            className="onboarding-link-button"
            disabled={isSubmitting}
            onClick={() => void handleSkip()}
          >
            Use {defaultNickname}
          </button>
        </form>
      )}

      {step === 3 && (
        <button type="button" className="onboarding-panel" onClick={onComplete}>
          <dotlottie-wc
            className="onboarding-lottie onboarding-lottie--welcome"
            src={WELCOME_LOTTIE_SRC}
            autoplay
            loop
            aria-hidden="true"
          />
          <h1>Welcome, {welcomeName}</h1>
          <p>Tap to open the map.</p>
        </button>
      )}
    </div>
  );
}
