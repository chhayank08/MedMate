"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBatSound } from "@/components/shared/bat-sound";

/**
 * Appearance settings. Currently exposes the optional Batcomputer sound
 * effects toggle (used by the Batman theme). Off by default and stored in the
 * browser (localStorage) — no account data is changed.
 */
export function AppearanceForm() {
  const { enabled, setSound } = useBatSound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose a theme from the toggle in the top bar. Optional theme sound effects can be enabled below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <Label htmlFor="bat-sound" className="text-sm font-medium">
              Batcomputer sound effects
            </Label>
            <p className="max-w-prose text-sm text-muted-foreground">
              Subtle synthesized boot, scanner, and task-complete tones for the Batman theme. Generated in your
              browser — no files are downloaded. Off by default.
            </p>
          </div>
          <Switch
            id="bat-sound"
            checked={enabled}
            onCheckedChange={(value: boolean) => setSound(value)}
            aria-label="Toggle Batcomputer sound effects"
          />
        </div>
      </CardContent>
    </Card>
  );
}
