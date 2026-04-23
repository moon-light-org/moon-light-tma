import { Search, MapPin, ShoppingBag, Utensils, Grid2x2 } from "lucide-react";
import type { LocationCategory } from "../../entities/location/model/types";

type HomeHeaderProps = {
  selectedCategories: LocationCategory[];
  onToggleCategory: (category: LocationCategory | "all") => void;
  onSearchClick: () => void;
};

// Bitcoin ₿ logo — tiny inline SVG since lucide doesn't have one
function BitcoinLogo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
      <path fill="#f7931a" d="M17.16 10.36c.24-1.6-.977-2.46-2.64-3.034l.54-2.165-1.317-.328-.525 2.107c-.347-.087-.703-.168-1.058-.25l.529-2.12L11.37 4.24l-.54 2.163c-.287-.066-.568-.13-.84-.2l.001-.005-1.817-.454-.35 1.406s.977.224.956.237c.533.133.63.486.613.766L8.8 10.52c.036.01.083.023.134.044l-.136-.034-.86 3.447c-.065.162-.23.405-.601.312.013.019-.957-.239-.957-.239l-.654 1.508 1.714.427c.319.08.631.163.939.241l-.545 2.189 1.316.328.54-2.168c.36.098.71.188 1.052.274l-.537 2.154 1.316.328.545-2.187c2.247.425 3.936.254 4.647-1.779.573-1.637-.029-2.58-1.211-3.196.861-.199 1.51-.766 1.682-1.935zM15.24 15.46c-.407 1.636-3.161.75-4.053.529l.723-2.898c.893.223 3.752.664 3.33 2.37zm.408-3.845c-.371 1.49-2.662.733-3.405.547l.655-2.629c.744.186 3.138.532 2.75 2.082z"/>
    </svg>
  );
}

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

export function HomeHeader({ selectedCategories, onToggleCategory, onSearchClick }: HomeHeaderProps) {
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
          <span className="search-bar__logo" aria-hidden="true">
            <BitcoinLogo />
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
