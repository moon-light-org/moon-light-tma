import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Shield, Trash2, UserCog, X } from "lucide-react";
import type { Location, LocationReview } from "../../entities/location/model/types";
import type { UserProfile } from "../../entities/user/model/types";

type TabKey = "members" | "locations";

type AdminSheetProps = {
  isOpen: boolean;
  members: UserProfile[];
  locations: Location[];
  selectedLocation: Location | null;
  selectedLocationReviews: LocationReview[];
  loadingMembers: boolean;
  loadingLocations: boolean;
  loadingReviews: boolean;
  busyUserId: number | null;
  deletingLocationId: number | null;
  deletingReviewId: number | null;
  error: string | null;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
  onBackToLocations: () => void;
  onToggleMemberRole: (member: UserProfile) => void;
  onDeleteLocation: (location: Location) => void;
  onDeleteReview: (review: LocationReview) => void;
};

export function AdminSheet({
  isOpen,
  members,
  locations,
  selectedLocation,
  selectedLocationReviews,
  loadingMembers,
  loadingLocations,
  loadingReviews,
  busyUserId,
  deletingLocationId,
  deletingReviewId,
  error,
  onClose,
  onSelectLocation,
  onBackToLocations,
  onToggleMemberRole,
  onDeleteLocation,
  onDeleteReview,
}: AdminSheetProps) {
  const [tab, setTab] = useState<TabKey>("members");
  if (!isOpen) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="bottom-sheet admin-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Admin panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header className="sheet-header">
          <h3>Admin</h3>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close admin panel">
            <X size={16} />
          </button>
        </header>

        <div className="admin-tabs" role="tablist" aria-label="Admin tabs">
          <button type="button" onClick={() => setTab("members")} className={tab === "members" ? "active" : ""}>
            Members
          </button>
          <button type="button" onClick={() => setTab("locations")} className={tab === "locations" ? "active" : ""}>
            Locations
          </button>
        </div>

        <div className="sheet-body admin-sheet__body">
          {tab === "members" ? (
            <div className="admin-list">
              {loadingMembers ? <p>Loading members...</p> : null}
              {!loadingMembers && members.length === 0 ? <p>No members found.</p> : null}
              {members.map((member) => (
                <article key={member.id} className="admin-item">
                  <div className="admin-item__meta">
                    <strong>{member.nickname || `User #${member.id}`}</strong>
                    <p>{member.telegram_id}</p>
                    <span className={`admin-role ${member.role === "admin" ? "is-admin" : ""}`}>{member.role}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary admin-item__btn"
                    disabled={busyUserId === member.id}
                    onClick={() => onToggleMemberRole(member)}
                  >
                    <UserCog size={14} />
                    {busyUserId === member.id
                      ? "Saving..."
                      : member.role === "admin"
                      ? "Set as user"
                      : "Promote"}
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          {tab === "locations" ? (
            <div className="admin-list">
              {!selectedLocation ? (
                <>
                  {loadingLocations ? <p>Loading locations...</p> : null}
                  {!loadingLocations && locations.length === 0 ? <p>No locations found.</p> : null}
                  {locations.map((location) => (
                    <article key={location.id} className="admin-item">
                      <button type="button" className="admin-item__row" onClick={() => onSelectLocation(location)}>
                        <div className="admin-item__meta">
                          <strong>{location.name}</strong>
                          <p>{location.category}</p>
                        </div>
                        <ChevronRight size={16} className="admin-item__chevron" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        aria-label={`Delete location ${location.name}`}
                        title="Delete location"
                        onClick={() => onDeleteLocation(location)}
                        disabled={deletingLocationId === location.id}
                      >
                        {deletingLocationId === location.id ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </article>
                  ))}
                </>
              ) : (
                <div>
                  <div className="admin-location-head">
                    <button type="button" className="btn-back" onClick={onBackToLocations}>
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <strong>{selectedLocation.name}</strong>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      aria-label={`Delete location ${selectedLocation.name}`}
                      title="Delete location"
                      onClick={() => onDeleteLocation(selectedLocation)}
                      disabled={deletingLocationId === selectedLocation.id}
                    >
                      {deletingLocationId === selectedLocation.id ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                  {loadingReviews ? <p>Loading reviews...</p> : null}
                  {!loadingReviews && selectedLocationReviews.length === 0 ? <p>No reviews.</p> : null}
                  <div className="location-review-list">
                    {selectedLocationReviews.map((review) => (
                      <article key={review.id} className="location-review-item">
                        <div className="admin-review-head">
                          <span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                          <button
                            type="button"
                            className="btn-icon-danger btn-icon-danger--small"
                            aria-label="Delete review"
                            title="Delete review"
                            onClick={() => onDeleteReview(review)}
                            disabled={deletingReviewId === review.id}
                          >
                            {deletingReviewId === review.id ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                        {review.text ? <p>{review.text}</p> : <p className="muted">No text review</p>}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {error ? (
            <p className="admin-error">
              <Shield size={14} />
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
