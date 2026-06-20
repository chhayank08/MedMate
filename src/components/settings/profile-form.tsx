"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import type { Profile } from "@/types";

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;
  // Remount when the loaded profile changes so initial values stay fresh.
  return <ProfileFormFields key={profile?.id ?? "new"} profile={profile ?? null} />;
}

function ProfileFormFields({ profile }: { profile: Profile | null }) {
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [examDate, setExamDate] = useState(profile?.exam_date ?? "");
  const [goal, setGoal] = useState(String(profile?.daily_goal_minutes ?? 120));

  async function save() {
    try {
      await update.mutateAsync({
        full_name: fullName,
        exam_date: examDate || null,
        daily_goal_minutes: Math.max(0, Number(goal) || 0),
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Doe" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="exam-date">Target exam date</Label>
            <Input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal">Daily study goal (minutes)</Label>
            <Input id="goal" type="number" min={0} step={15} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}
