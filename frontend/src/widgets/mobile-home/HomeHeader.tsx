import { Search, MapPin, ShoppingBag, Utensils, Grid2x2 } from "lucide-react";
import type { LocationCategory } from "../../entities/location/model/types";

type HomeHeaderProps = {
  selectedCategories: LocationCategory[];
  onToggleCategory: (category: LocationCategory | "all") => void;
  onSearchClick: () => void;
  profileInitial: string;
  onProfileClick: () => void;
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
  onProfileClick,
}: HomeHeaderProps) {
  const isSelected = (category: LocationCategory | "all") => {
    if (category === "all") return selectedCategories.length === 0;
    return selectedCategories.includes(category);
  };

  return (
    <>
      {/* Search bar */}
      <div className="top-bar">
        <button className="search-bar" type="button" onClick={onSearchClick} aria-label="Search Bitcoin-friendly spots">
          <span className="search-bar__icon">
            <Search size={16} />
          </span>
          <span className="search-bar__text">Search BTC places…</span>
        </button>
        <button className="profile-avatar-btn" type="button" onClick={onProfileClick} aria-label="Open profile">
          <span className="search-bar__avatar" aria-hidden="true">
            {profileInitial}
          </span>
        </button>
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
      </nav>
    </>
  );
}
