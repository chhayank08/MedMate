"use client";

import { useState } from "react";
import { GraduationCap, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import type { Profile } from "@/types";

interface AcademicProfileCardProps {
  profile: Pick<
    Profile,
    | "college_name"
    | "university_name"
    | "degree_program"
    | "course"
    | "year_of_study"
    | "semester"
    | "expected_graduation_year"
  > | null;
}

type AcademicFields = Pick<
  Profile,
  | "college_name"
  | "university_name"
  | "degree_program"
  | "course"
  | "year_of_study"
  | "semester"
  | "expected_graduation_year"
>;

function toFields(
  p: Partial<AcademicFields> | null | undefined,
): AcademicFields {
  return {
    college_name: p?.college_name ?? null,
    university_name: p?.university_name ?? null,
    degree_program: p?.degree_program ?? null,
    course: p?.course ?? null,
    year_of_study: p?.year_of_study ?? null,
    semester: p?.semester ?? null,
    expected_graduation_year: p?.expected_graduation_year ?? null,
  };
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value ?? <span className="text-muted-foreground italic">Not set</span>}
      </span>
    </div>
  );
}

export function AcademicProfileCard({ profile: initial }: AcademicProfileCardProps) {
  const { data: profileData } = useProfile();
  // Fall back to server-fetched prop while React Query hydrates (no loading flash).
  const live = profileData ?? initial;

  const [open, setOpen] = useState(false);
  // Local state for the dialog form fields only.
  const [fields, setFields] = useState<AcademicFields>(() => toFields(live));

  const update = useUpdateProfile();

  function openDialog() {
    setFields(toFields(live)); // always reset to current saved values
    setOpen(true);
  }

  function set(key: keyof AcademicFields, value: string) {
    const numberKeys: (keyof AcademicFields)[] = [
      "year_of_study",
      "semester",
      "expected_graduation_year",
    ];
    setFields((prev) => ({
      ...prev,
      [key]: numberKeys.includes(key)
        ? value === ""
          ? null
          : Number(value)
        : value || null,
    }));
  }

  async function save() {
    try {
      await update.mutateAsync(fields);
      setOpen(false);
      toast.success("Academic profile updated.");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  const isEmpty =
    !live?.college_name &&
    !live?.university_name &&
    !live?.degree_program &&
    !live?.course &&
    live?.year_of_study == null &&
    live?.semester == null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-primary" />
            Academic Profile
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={openDialog}
            aria-label="Edit academic profile"
          >
            <Pencil className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Add your institution, program, and year so AI features can personalize content to your curriculum.{" "}
              <button
                type="button"
                onClick={openDialog}
                className="text-primary underline underline-offset-2"
              >
                Set up now
              </button>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <InfoRow label="College" value={live?.college_name} />
              <InfoRow label="University" value={live?.university_name} />
              <InfoRow label="Degree" value={live?.degree_program} />
              <InfoRow label="Program / Course" value={live?.course} />
              <InfoRow label="Year" value={live?.year_of_study} />
              <InfoRow label="Semester" value={live?.semester} />
              {live?.expected_graduation_year && (
                <InfoRow label="Expected Graduation" value={live.expected_graduation_year} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Academic Profile</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ap-college">College / Institution</Label>
              <Input
                id="ap-college"
                placeholder="e.g. MIT, Stanford, IIT Delhi"
                value={fields.college_name ?? ""}
                onChange={(e) => set("college_name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-university">University</Label>
              <Input
                id="ap-university"
                placeholder="e.g. MIT, Harvard University"
                value={fields.university_name ?? ""}
                onChange={(e) => set("university_name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-degree">Degree Program</Label>
              <Input
                id="ap-degree"
                placeholder="e.g. B.Tech, MBA, MBBS, LLB"
                value={fields.degree_program ?? ""}
                onChange={(e) => set("degree_program", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-course">Specialization / Course</Label>
              <Input
                id="ap-course"
                placeholder="e.g. Computer Science, Finance, Medicine"
                value={fields.course ?? ""}
                onChange={(e) => set("course", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ap-year">Year of Study</Label>
                <Input
                  id="ap-year"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="e.g. 2"
                  value={fields.year_of_study ?? ""}
                  onChange={(e) => set("year_of_study", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ap-sem">Semester</Label>
                <Input
                  id="ap-sem"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="e.g. 3"
                  value={fields.semester ?? ""}
                  onChange={(e) => set("semester", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-grad">Expected Graduation Year</Label>
              <Input
                id="ap-grad"
                type="number"
                min={2024}
                max={2040}
                placeholder="e.g. 2029"
                value={fields.expected_graduation_year ?? ""}
                onChange={(e) => set("expected_graduation_year", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
