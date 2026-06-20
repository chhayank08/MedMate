"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { Profile } from "@/types";

export function AcademicProfileForm({ profile }: { profile: Profile | null }) {
  const update = useUpdateProfile();
  const [collegeName, setCollegeName] = useState(profile?.college_name ?? "");
  const [universityName, setUniversityName] = useState(profile?.university_name ?? "");
  const [course, setCourse] = useState(profile?.course ?? "");
  const [degreeProgram, setDegreeProgram] = useState(profile?.degree_program ?? "");
  const [yearOfStudy, setYearOfStudy] = useState(String(profile?.year_of_study ?? ""));
  const [semester, setSemester] = useState(String(profile?.semester ?? ""));
  const [graduationYear, setGraduationYear] = useState(String(profile?.expected_graduation_year ?? ""));

  async function save() {
    try {
      await update.mutateAsync({
        college_name: collegeName || null,
        university_name: universityName || null,
        course: course || null,
        degree_program: degreeProgram || null,
        year_of_study: Number(yearOfStudy) || null,
        semester: Number(semester) || null,
        expected_graduation_year: Number(graduationYear) || null,
      });
      toast.success("Academic profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>College name</Label>
            <Input placeholder="AIIMS New Delhi" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>University / Affiliated to</Label>
            <Input placeholder="Delhi University" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Degree program</Label>
            <Input placeholder="MBBS" value={degreeProgram} onChange={(e) => setDegreeProgram(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Course</Label>
            <Input placeholder="Medicine & Surgery" value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Year of study</Label>
            <Input type="number" min={1} max={10} placeholder="2" value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Semester</Label>
            <Input type="number" min={1} max={20} placeholder="3" value={semester} onChange={(e) => setSemester(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Expected graduation year</Label>
            <Input type="number" min={2024} max={2040} placeholder="2029" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save academic profile
        </Button>
      </CardContent>
    </Card>
  );
}
