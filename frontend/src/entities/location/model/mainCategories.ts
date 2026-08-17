import {
  BedDouble,
  Bitcoin,
  Grid2x2,
  ShoppingBag,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { LocationCategory, LocationMainCategory } from "./types";

export type MainCategoryOption = {
  value: LocationMainCategory;
  label: string;
  Icon: LucideIcon;
  legacyCategory: LocationCategory;
};

export const MAIN_CATEGORY_OPTIONS: MainCategoryOption[] = [
  { value: "accommodation", label: "Accommodation", Icon: BedDouble, legacyCategory: "other" },
  { value: "bitcoin", label: "Bitcoin", Icon: Bitcoin, legacyCategory: "other" },
  { value: "food_drink", label: "Food & drink", Icon: Utensils, legacyCategory: "restaurant-bar" },
  { value: "other", label: "Other", Icon: Grid2x2, legacyCategory: "other" },
  { value: "retail", label: "Retail", Icon: ShoppingBag, legacyCategory: "grocery" },
  { value: "services", label: "Services", Icon: Wrench, legacyCategory: "other" },
];

export const MAIN_CATEGORY_BY_VALUE = Object.fromEntries(
  MAIN_CATEGORY_OPTIONS.map((option) => [option.value, option])
) as Record<LocationMainCategory, MainCategoryOption>;
