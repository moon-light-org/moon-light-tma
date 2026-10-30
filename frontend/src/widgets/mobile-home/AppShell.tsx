import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Compass, MapPin, Plus, Search, Shield, SlidersHorizontal, UserRound, X, Zap } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../entities/location/model/mainCategories";
import type { Location, LocationMainCategory } from "../../entities/location/model/types";

type ToolbarProps = {
  category: LocationMainCategory | null;
  onCategory: (value: LocationMainCategory | null) => void;
  lightningOnly: boolean;
  onLightning: () => void;
  lightningCount: number;
  onSearch: () => void;
  isAdmin: boolean;
  onAdmin: () => void;
};

export function ExploreToolbar({ category, onCategory, lightningOnly, onLightning, lightningCount, onSearch, isAdmin, onAdmin }: ToolbarProps) {
  return <motion.section className="explore-toolbar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
    <button className="shell-search" onClick={onSearch}><Search size={19} strokeWidth={1.7} /><span>Search places…</span></button>
    <PlaceFilters category={category} onCategory={onCategory} lightningOnly={lightningOnly} onLightning={onLightning} lightningCount={lightningCount} isAdmin={isAdmin} onAdmin={onAdmin} />
  </motion.section>;
}

type PlaceFiltersProps = Omit<ToolbarProps, "onSearch" | "isAdmin" | "onAdmin"> & {
  isAdmin?: boolean;
  onAdmin?: () => void;
};

export function PlaceFilters({ category, onCategory, lightningOnly, onLightning, lightningCount, isAdmin = false, onAdmin }: PlaceFiltersProps) {
  const categories = ["food_drink", "retail", "bitcoin", "accommodation", "services", "other"] as const;
  return (
    <div className="shell-category-bar">
      <details className="shell-filter-menu">
        <summary className={`shell-chip shell-filter-button${lightningOnly ? " is-active" : ""}`} aria-label="Payment filters"><SlidersHorizontal size={19} />{lightningOnly && <i />}</summary>
        <div className="shell-filter-panel">
          <label><span><Zap size={16} />Lightning only <small>{lightningCount}</small></span><input type="checkbox" checked={lightningOnly} onChange={onLightning} /></label>
        </div>
      </details>
      <nav className="shell-filters" aria-label="Filter places">
        <motion.button whileTap={{ scale: .97 }} className={`shell-chip${!category ? " is-active" : ""}`} aria-pressed={!category} onClick={() => onCategory(null)}>All</motion.button>
        {categories.map((value) => <motion.button key={value} whileTap={{ scale: .97 }} className={`shell-chip${category === value ? " is-active" : ""}`} aria-pressed={category === value} onClick={() => onCategory(category === value ? null : value)}>{value === "food_drink" ? "Food and drink" : MAIN_CATEGORY_BY_VALUE[value].label}</motion.button>)}
        {isAdmin && <button className="shell-chip" onClick={onAdmin} aria-label="Open admin panel"><Shield size={16} /></button>}
      </nav>
    </div>
  );
}

export function MapLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return <motion.div className={`shell-loader${fullScreen ? " shell-loader--full" : ""}`} role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="shell-loader__orbit"><span /><span /><span /><Compass size={23} strokeWidth={1.5} /></div>
    <strong>Loading map</strong>
    <div className="shell-loader__track"><span /></div>
  </motion.div>;
}

export function PlacePreview({ location, onDetails, onClose }: { location: Location; onDetails: () => void; onClose: () => void }) {
  const category = MAIN_CATEGORY_BY_VALUE[location.main_category];
  return <motion.article className="place-preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 350, damping: 32 }}>
    <div className="place-preview__top"><span className="place-preview__category">{location.is_approved ? <><BadgeCheck size={14} />Verified place</> : <><MapPin size={14} />Community listing</>}</span><button onClick={onClose} aria-label="Close place preview"><X size={16} /></button></div>
    <div className="place-preview__main"><div><h2>{location.name}</h2><p>{category.label}{location.address ? ` · ${location.address}` : ""}</p></div><span className="place-preview__icon">{location.accepts_lightning ? <Zap size={23} /> : <category.Icon size={23} />}</span></div>
    <div className="place-preview__bottom"><span><i />{location.accepts_lightning ? "Accepts Lightning" : location.accepts_bitcoin ? "Accepts Bitcoin" : "Payment info unconfirmed"}</span><button onClick={onDetails}>View place<ArrowRight size={15} /></button></div>
  </motion.article>;
}

export function BottomNavigation({ active, onMap, onExplore, onAdd, onProfile }: { active: "map" | "explore" | "profile"; onMap: () => void; onExplore: () => void; onAdd: () => void; onProfile: () => void }) {
  const items = [{ id: "map", label: "Map", Icon: Compass, action: onMap }, { id: "explore", label: "Explore", Icon: Search, action: onExplore }, { id: "add", label: "Add place", Icon: Plus, action: onAdd }, { id: "profile", label: "Profile", Icon: UserRound, action: onProfile }];
  return <nav className="shell-bottom-nav" aria-label="Main navigation">{items.map(({ id, label, Icon, action }) => <motion.button key={id} whileTap={{ scale: .94 }} className={active === id ? "is-active" : ""} onClick={action} aria-current={active === id ? "page" : undefined}><span className="shell-bottom-nav__icon"><Icon size={20} strokeWidth={active === id ? 2 : 1.6} /><AnimatePresence>{active === id && <motion.span layoutId="active-nav" className="shell-bottom-nav__indicator" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}</AnimatePresence></span><span>{label}</span></motion.button>)}</nav>;
}
