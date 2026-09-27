import { ChevronDown, Search, Shield, ShoppingBag, Utensils } from "lucide-react";
import { MAIN_CATEGORY_OPTIONS } from "../../entities/location/model/mainCategories";
import type { LocationMainCategory } from "../../entities/location/model/types";

type HomeHeaderProps = {
  selectedCategory: LocationMainCategory | null;
  onSelectCategory: (category: LocationMainCategory | null) => void;
  onSearchClick: () => void;
  profileInitial: string;
  onProfileClick: () => void;
  isAdmin: boolean;
  onAdminClick: () => void;
};

const additionalCategories = MAIN_CATEGORY_OPTIONS.filter(({ value }) => value !== "food_drink" && value !== "retail");

export function HomeHeader({
  selectedCategory,
  onSelectCategory,
  onSearchClick,
  profileInitial,
  onProfileClick,
  isAdmin,
  onAdminClick,
}: HomeHeaderProps) {
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
                {profileInitial}
              </span>
            </button>
          </span>
        </div>
      </div>

      {/* Category filter chips */}
      <nav className="filter-row" aria-label="Filter by category">
        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "food_drink" ? null : "food_drink")}
          className={`filter-chip${selectedCategory === "food_drink" ? " is-active" : ""}`}
          aria-pressed={selectedCategory === "food_drink"}
        >
          <Utensils size={14} />
          <span>Food & drink</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "retail" ? null : "retail")}
          className={`filter-chip${selectedCategory === "retail" ? " is-active" : ""}`}
          aria-pressed={selectedCategory === "retail"}
        >
          <ShoppingBag size={14} />
          <span>Retail</span>
        </button>
        <label className={`filter-select${additionalCategories.some(({ value }) => value === selectedCategory) ? " is-active" : ""}`}>
          <select
            value={selectedCategory && selectedCategory !== "food_drink" && selectedCategory !== "retail" ? selectedCategory : ""}
            onChange={(event) => onSelectCategory((event.target.value || null) as LocationMainCategory | null)}
            aria-label="Select another category"
          >
            <option value="">All categories</option>
            {additionalCategories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <span>{additionalCategories.find(({ value }) => value === selectedCategory)?.label ?? "Categories"}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
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
