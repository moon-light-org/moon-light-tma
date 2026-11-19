import { useState } from "react";
import { ArrowLeft, ChevronRight, Pencil, X } from "lucide-react";
import type { TelegramUser, UserProfile } from "../../entities/user/model/types";
import { ProfileArticle, type ProfileArticleKind } from "./ProfileArticle";

type ProfileSheetProps = {
  isOpen: boolean;
  profileInitial: string;
  telegramUser: TelegramUser | null;
  userProfile: UserProfile | null;
  placesAddedCount: number;
  hasPendingSubmission: boolean;
  isSavingProfile: boolean;
  profileError: string | null;
  onSaveProfile: (nickname: string) => Promise<void>;
  onAddLocationClick: () => void;
  onClose: () => void;
};

export function ProfileSheet({ isOpen, profileInitial, telegramUser, userProfile, placesAddedCount,
  hasPendingSubmission, isSavingProfile, profileError, onSaveProfile, onAddLocationClick, onClose }: ProfileSheetProps) {
  const [view, setView] = useState<"menu" | "edit" | "activity" | ProfileArticleKind>("menu");
  const [nicknameInput, setNicknameInput] = useState(userProfile?.nickname ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayName = userProfile?.nickname?.trim() || telegramUser?.first_name?.trim() || "Telegram User";
  const avatarUrl = userProfile?.avatar_url || telegramUser?.photo_url;
  const joinedDate = formatJoinedDate(userProfile?.created_at);
  const isArticle = view === "privacy" || view === "terms" || view === "about";
  const save = async () => {
    const nickname = nicknameInput.trim();
    if (nickname.length < 2) { setLocalError("Nickname must be at least 2 characters."); return; }
    try { await onSaveProfile(nickname); setLocalError(null); setView("menu"); }
    catch { /* The parent supplies the visible profile error. */ }
  };

  return (
    <section className="profile-page" role="region" aria-label="Profile menu">
      <header className="profile-page__topbar">
        <button type="button" onClick={view === "menu" || isArticle ? onClose : () => setView("menu")} aria-label={view === "menu" || isArticle ? "Close profile" : "Back to profile menu"}>
          {view === "menu" || isArticle ? <X size={24} /> : <ArrowLeft size={22} />}
        </button>
        <strong>MoonLight</strong>
        <span aria-hidden="true" />
      </header>
      <div className="profile-page__scroll" key={view}>
        <div className="profile-page__content">
          {view === "menu" ? <>
            <div className="profile-page__identity">
              <div className="profile-page__avatar" aria-hidden="true">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : profileInitial}
              </div>
              <div className="profile-page__person">
                <h1>{displayName}</h1>
                <p>{userProfile?.created_at ? `Joined ${joinedDate}` : "MoonLight profile"}</p>
              </div>
              <button type="button" className="profile-page__edit-button" onClick={() => { setNicknameInput(userProfile?.nickname ?? ""); setLocalError(null); setView("edit"); }} disabled={!userProfile} aria-label="Edit profile"><Pencil size={19} /></button>
            </div>
            <nav className="profile-page__menu" aria-label="Profile options">
              <button type="button" onClick={onAddLocationClick} disabled={hasPendingSubmission || !userProfile}>
                <span>Contribute</span><ChevronRight size={19} />
              </button>
              <button type="button" disabled title="Coming soon" aria-label="Contact us, coming soon">
                <span>Contact us<small>Coming soon</small></span><ChevronRight size={19} />
              </button>
              <button type="button" onClick={() => setView("activity")}><span>Activity</span><ChevronRight size={19} /></button>
              <button type="button" disabled title="Coming soon" aria-label="My saves, coming soon"><span>My saves<small>Coming soon</small></span><ChevronRight size={19} /></button>
              <button type="button" onClick={() => setView("privacy")}><span>Privacy policy</span><ChevronRight size={19} /></button>
              <button type="button" onClick={() => setView("terms")}><span>Terms of use</span><ChevronRight size={19} /></button>
              <button type="button" onClick={() => setView("about")}><span>About MoonLight</span><ChevronRight size={19} /></button>
              <button type="button" disabled title="Coming soon" aria-label="Delete account, coming soon"><span>Delete account<small>Coming soon</small></span><ChevronRight size={19} /></button>
            </nav>
            {hasPendingSubmission && <p className="profile-page__note">Your submitted place is pending confirmation.</p>}
          </> : view === "edit" ? <div className="profile-page__subview">
            <h1>Edit profile</h1>
            <label className="form-label" htmlFor="profile-nickname">Nickname</label>
            <input id="profile-nickname" className="onboarding-input" value={nicknameInput} onChange={(event) => setNicknameInput(event.target.value)} maxLength={32} placeholder="Enter nickname" />
            {localError && <p className="onboarding-error">{localError}</p>}
            {profileError && <p className="onboarding-error">{profileError}</p>}
            <button type="button" className="btn-primary onboarding-submit" onClick={() => void save()} disabled={isSavingProfile || !userProfile}>{isSavingProfile ? "Saving..." : "Save profile"}</button>
          </div> : isArticle ? <ProfileArticle kind={view} onBack={() => setView("menu")} /> : <div className="profile-page__subview">
            <h1>Activity</h1>
            <div className="profile-page__activity"><strong>{placesAddedCount}</strong><span>Places added</span></div>
            {hasPendingSubmission && <p className="profile-page__note">One submitted place is pending confirmation.</p>}
          </div>}
        </div>
      </div>
    </section>
  );
}

function formatJoinedDate(createdAt?: string): string {
  if (!createdAt) return "Not available";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
