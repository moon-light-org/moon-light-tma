import { useEffect, useState } from "react";
import { X, CalendarDays, MapPin } from "lucide-react";
import type { TelegramUser, UserProfile } from "../../entities/user/model/types";

type ProfileSheetProps = {
  isOpen: boolean;
  profileInitial: string;
  telegramUser: TelegramUser | null;
  userProfile: UserProfile | null;
  placesAddedCount: number;
  isSavingProfile: boolean;
  profileError: string | null;
  onSaveProfile: (nickname: string) => Promise<void>;
  onClose: () => void;
};

export function ProfileSheet({
  isOpen,
  profileInitial,
  telegramUser,
  userProfile,
  placesAddedCount,
  isSavingProfile,
  profileError,
  onSaveProfile,
  onClose,
}: ProfileSheetProps) {
  const [nicknameInput, setNicknameInput] = useState(userProfile?.nickname ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setNicknameInput(userProfile?.nickname ?? "");
  }, [userProfile?.nickname]);

  if (!isOpen) {
    return null;
  }

  const displayName = userProfile?.nickname?.trim() || telegramUser?.first_name?.trim() || "Telegram User";
  const username = telegramUser?.username?.trim() ? `@${telegramUser.username.trim()}` : null;
  const joinedDate = formatJoinedDate(userProfile?.created_at);

  const handleSave = async () => {
    const normalized = nicknameInput.trim();
    if (normalized.length < 2) {
      setLocalError("Nickname must be at least 2 characters.");
      return;
    }
    await onSaveProfile(normalized);
    setLocalError(null);
  };

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="bottom-sheet profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header className="sheet-header">
          <h3>Profile</h3>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close profile">
            <X size={16} />
          </button>
        </header>

        <div className="profile-sheet__body">
          <div className="profile-sheet__user">
            <div className="profile-sheet__avatar-wrap">
              <div className="profile-sheet__avatar" aria-hidden="true">
                {profileInitial}
              </div>
            </div>
            <div className="profile-sheet__identity">
              <h4>{displayName}</h4>
              {username && <p>{username}</p>}
            </div>
          </div>

          <div className="profile-sheet__stats">
            <div className="profile-stat">
              <div className="profile-stat__icon">
                <CalendarDays size={14} />
              </div>
              <div className="profile-stat__meta">
                <span className="profile-stat__label">Joined</span>
                <strong className="profile-stat__value">{joinedDate}</strong>
              </div>
            </div>

            <div className="profile-stat">
              <div className="profile-stat__icon">
                <MapPin size={14} />
              </div>
              <div className="profile-stat__meta">
                <span className="profile-stat__label">Places added</span>
                <strong className="profile-stat__value">{placesAddedCount}</strong>
              </div>
            </div>
          </div>

          <div className="profile-sheet__edit">
            <label className="form-label" htmlFor="profile-nickname">Nickname</label>
            <input
              id="profile-nickname"
              className="onboarding-input"
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              maxLength={32}
              placeholder="Enter nickname"
            />
            {localError ? <p className="onboarding-error">{localError}</p> : null}
            {profileError ? <p className="onboarding-error">{profileError}</p> : null}
            <button type="button" className="btn-primary onboarding-submit" onClick={handleSave} disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatJoinedDate(createdAt?: string): string {
  if (!createdAt) {
    return "Not available";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
