import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { badges as badgeDefinitions, type Badge } from "@/data/mockData";

interface EarnedBadge {
  badge_id: string;
  earned_at: string;
}

/**
 * Hook that loads earned badges from DB and merges with definitions.
 * Also provides `checkAndAward` to evaluate criteria after actions.
 */
export function useBadges(userId: string | undefined) {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarned = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from("user_badges" as any)
      .select("badge_id, earned_at")
      .eq("user_id", userId) as any;
    if (data) setEarnedBadges(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchEarned(); }, [fetchEarned]);

  // Merge definitions with earned status
  const mergedBadges: Badge[] = badgeDefinitions.map(b => {
    const earned = earnedBadges.find(e => e.badge_id === b.id);
    return {
      ...b,
      earned: !!earned,
      earnedAt: earned ? new Date(earned.earned_at).toLocaleDateString("pt-BR") : undefined,
    };
  });

  // Award a single badge (idempotent via unique constraint)
  const awardBadge = useCallback(async (badgeId: string) => {
    if (!userId) return;
    if (earnedBadges.some(e => e.badge_id === badgeId)) return;
    await (supabase.from("user_badges" as any) as any).insert({
      user_id: userId,
      badge_id: badgeId,
    });
    // Refresh
    await fetchEarned();
  }, [userId, earnedBadges, fetchEarned]);

  /**
   * Evaluate all badge criteria based on current user data.
   * Call after answering questions, timer sessions, etc.
   */
  const checkAndAward = useCallback(async (context?: {
    totalEssays?: number;
    lastScore?: number;
    rankPosition?: number;
    weeklyRankPosition?: number;
    weeklyHours?: number;
    streak?: number;
    averageGrade?: number;
    subscriptionTier?: string | null;
    answeredWeekly?: boolean;
  }) => {
    if (!userId || !context) return;
    const toAward: string[] = [];
    const c = context;

    // Discursivas count badges
    if (c.totalEssays !== undefined) {
      if (c.totalEssays >= 1) toAward.push("b1");
      if (c.totalEssays >= 5) toAward.push("b2");
      if (c.totalEssays >= 10) toAward.push("b3");
      if (c.totalEssays >= 50) toAward.push("b17");
      if (c.totalEssays >= 100) toAward.push("b18");
      if (c.totalEssays >= 200) toAward.push("b19");
      if (c.totalEssays >= 500) toAward.push("b20");
      if (c.totalEssays >= 1000) toAward.push("b21");
      if (c.totalEssays >= 5000) toAward.push("b22");
    }

    // Score badges
    if (c.lastScore !== undefined) {
      if (c.lastScore >= 8) toAward.push("b4");
      if (c.lastScore >= 9) toAward.push("b5");
    }

    // Ranking badges
    if (c.rankPosition !== undefined) {
      if (c.rankPosition >= 1 && c.rankPosition <= 10) toAward.push("b6");
      if (c.rankPosition === 1) toAward.push("b8");
    }
    if (c.weeklyRankPosition !== undefined) {
      if (c.weeklyRankPosition >= 1 && c.weeklyRankPosition <= 3) toAward.push("b7");
    }

    // Study hours
    if (c.weeklyHours !== undefined) {
      const totalHours = c.weeklyHours;
      if (totalHours >= 10) toAward.push("b9");
      if (totalHours >= 50) toAward.push("b10");
      if (totalHours >= 100) toAward.push("b11");
    }

    // Streak
    if (c.streak !== undefined) {
      if (c.streak >= 7) toAward.push("b12");
      if (c.streak >= 30) toAward.push("b13");
      if (c.streak >= 60) toAward.push("b14");
    }

    // Weekly challenge
    if (c.answeredWeekly) toAward.push("b15");

    // Subscription
    if (c.subscriptionTier === "annual") toAward.push("b23");

    // Award only new ones
    const newBadges = toAward.filter(id => !earnedBadges.some(e => e.badge_id === id));
    if (newBadges.length === 0) return;

    // Insert all at once
    const rows = newBadges.map(badge_id => ({ user_id: userId, badge_id }));
    await (supabase.from("user_badges" as any) as any).insert(rows);
    await fetchEarned();

    return newBadges;
  }, [userId, earnedBadges, fetchEarned]);

  return { badges: mergedBadges, loading, checkAndAward, awardBadge, refetch: fetchEarned };
}
