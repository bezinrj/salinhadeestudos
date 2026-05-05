import { BookOpen, Calculator, Scale, Building, Shield, GraduationCap, Gavel, Briefcase, Trophy, Star, Flame, Award } from "lucide-react";

export const TURMA_ICONS: Record<string, any> = {
  BookOpen, Calculator, Scale, Building, Shield, GraduationCap, Gavel, Briefcase, Trophy, Star, Flame, Award,
};

export const TURMA_ICON_NAMES = Object.keys(TURMA_ICONS);

export function getTurmaIcon(name?: string | null) {
  if (!name) return BookOpen;
  return TURMA_ICONS[name] || BookOpen;
}
