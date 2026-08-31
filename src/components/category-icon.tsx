import {
  BookOpen,
  Bus,
  CalendarDays,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Laptop,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Users,
  UserPlus,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Bus,
  CalendarDays,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Laptop,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Users,
  UserPlus,
  Utensils,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
