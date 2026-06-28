"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, User as UserIcon, Crown } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { usePremiumStatus } from "@/hooks/use-premium";
import { cn } from "@/lib/utils";

export function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const { isPremium, isLifetime, isInitialized } = usePremiumStatus();
  
  // CRITICAL: Wait for hydration before showing premium UI to prevent flicker
  const showPremiumUI = isInitialized && (isPremium || isLifetime);
  const showLifetimeUI = isInitialized && isLifetime;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" />
        }
      >
        <div className="relative">
          <Avatar className={cn(
            "size-8",
            showLifetimeUI && "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background"
          )}>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name ?? "User"} />}
            <AvatarFallback className={showLifetimeUI ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" : ""}>
              {getInitials(name, email)}
            </AvatarFallback>
          </Avatar>
          {showLifetimeUI && (
            <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center ring-2 ring-background">
              <Crown className="size-2.5 text-white" />
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium">{name ?? "Student"}</span>
                {showLifetimeUI && <Crown className="size-3.5 text-yellow-500 shrink-0" />}
              </div>
              {email && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {email}
                </span>
              )}
              {showLifetimeUI && (
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-500 mt-1">
                  Lifetime Member
                </span>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
