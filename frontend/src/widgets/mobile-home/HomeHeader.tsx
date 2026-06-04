import { Search, MapPin, ShoppingBag, Utensils, Grid2x2, Shield } from "lucide-react";
import type { LocationCategory } from "../../entities/location/model/types";

type HomeHeaderProps = {
  selectedCategories: LocationCategory[];
  onToggleCategory: (category: LocationCategory | "all") => void;
  onSearchClick: () => void;
  profileInitial: string;
  profileAvatarUrl?: string | null;
  onProfileClick: () => void;
  isAdmin: boolean;
  onAdminClick: () => void;
};

const categories: Array<{
  id: LocationCategory | "all";
  label: string;
  Icon: React.ElementType;
}> = [
  { id: "all",            label: "All",     Icon: MapPin },
  { id: "grocery",        label: "Grocery", Icon: ShoppingBag },
  { id: "restaurant-bar", label: "Food",    Icon: Utensils },
  { id: "other",          label: "Other",   Icon: Grid2x2 },
];

export function HomeHeader({
  selectedCategories,
  onToggleCategory,
  onSearchClick,
  profileInitial,
  profileAvatarUrl,
  onProfileClick,
  isAdmin,
  onAdminClick,
}: HomeHeaderProps) {
  const isSelected = (category: LocationCategory | "all") => {
    if (category === "all") return selectedCategories.length === 0;
    return selectedCategories.includes(category);
  };

  return (
    <>
      {/* Search bar */}
      <div className="top-bar">
        <div className="search-bar">
          <button className="search-bar__trigger" type="button" onClick={onSearchClick} aria-label="Search Bitcoin-friendly spots">
            <span className="search-bar__icon">
              <Search size={16} />
            </span>
            <span className="search-bar__text">Search BTC places…</span>
          </button>
          <span className="search-bar__avatar-wrap">
            <button className="search-bar__avatar-btn" type="button" onClick={onProfileClick} aria-label="Open profile">
              <span className="search-bar__avatar" aria-hidden="true">
                {profileAvatarUrl ? <img src={profileAvatarUrl} alt="" /> : profileInitial}
              </span>
            </button>
          </span>
        </div>
      </div>

      {/* Category filter chips */}
      <nav className="filter-row" aria-label="Filter by category">
        {categories.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggleCategory(id)}
            className={`filter-chip${isSelected(id) ? " is-active" : ""}`}
            aria-pressed={isSelected(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
        {isAdmin ? (
          <button
            type="button"
            onClick={onAdminClick}
            className="filter-chip filter-chip--admin"
            aria-label="Open admin panel"
          >
            <Shield size={14} />
            <span>Admin</span>
          </button>
        ) : null}
      </nav>
    </>
  );
}
