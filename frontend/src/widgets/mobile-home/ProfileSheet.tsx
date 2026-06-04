import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { X, CalendarDays, MapPin, ImagePlus } from "lucide-react";
import type { TelegramUser, UserProfile } from "../../entities/user/model/types";

type ProfileSheetProps = {
  isOpen: boolean;
  profileInitial: string;
  telegramUser: TelegramUser | null;
  userProfile: UserProfile | null;
  placesAddedCount: number;
  isSavingProfile: boolean;
  profileError: string | null;
  onSaveProfile: (nickname: string, avatarUrl?: string | null) => Promise<void>;
  onClose: () => void;
};

const MAX_IMAGE_BYTES = 1024 * 1024;

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar_url ?? telegramUser?.photo_url ?? null);
  const [avatarUpload, setAvatarUpload] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNicknameInput(userProfile?.nickname ?? "");
      setAvatarPreview(userProfile?.avatar_url ?? telegramUser?.photo_url ?? null);
      setAvatarUpload(null);
      setLocalError(null);
    }
  }, [isOpen, telegramUser?.photo_url, userProfile?.avatar_url, userProfile?.nickname]);

  if (!isOpen) {
    return null;
  }

  const displayName = userProfile?.nickname?.trim() || telegramUser?.first_name?.trim() || "Telegram User";
  const username = telegramUser?.username?.trim() ? `@${telegramUser.username.trim()}` : null;
  const joinedDate = formatJoinedDate(userProfile?.created_at);

  const handleSave = async () => {
    await onSaveProfile(nicknameInput, avatarUpload ?? undefined);
    setAvatarUpload(null);
    setLocalError(null);
  };

  const handleAvatarPick = () => {
    if (isSavingProfile) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLocalError("Only image files are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError("Image must be 1MB or smaller.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarUpload(dataUrl);
      setAvatarPreview(dataUrl);
      setLocalError(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Failed to read image file");
    }
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
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" />
                ) : (
                  profileInitial
                )}
              </div>
              <button type="button" className="profile-sheet__avatar-action" onClick={handleAvatarPick} disabled={isSavingProfile}>
                <ImagePlus size={14} />
                Upload avatar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleAvatarChange}
              />
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image file"));
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
