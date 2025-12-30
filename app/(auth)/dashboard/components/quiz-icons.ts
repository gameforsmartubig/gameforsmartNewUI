import {
  BookOpen,
  Microscope,
  Calculator,
  History,
  Globe,
  Languages,
  Laptop,
  Dumbbell,
  Film,
  Briefcase
} from "lucide-react";

/** ⬇️ KUNCI UTAMA */
export type CategoryIconName =
  | "BookOpen"
  | "Microscope"
  | "Calculator"
  | "History"
  | "Globe"
  | "Languages"
  | "Laptop"
  | "Dumbbell"
  | "Film"
  | "Briefcase";

export const categoryIconMap: Record<
  CategoryIconName,
  React.ElementType
> = {
  BookOpen,
  Microscope,
  Calculator,
  History,
  Globe,
  Languages,
  Laptop,
  Dumbbell,
  Film,
  Briefcase
};
