"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useHKActive } from "@/components/shared/hk-decorations";
import { HK_NAV_ICONS } from "@/components/dashboard/hk-nav";
import { useBatActive } from "@/components/shared/bat-decorations";
import { BAT_NAV_ICONS } from "@/components/dashboard/bat-nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const hk = useHKActive();
  const bat = useBatActive();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const HKIcon = hk ? HK_NAV_ICONS[href] : undefined;
        const BatIcon = bat ? BAT_NAV_ICONS[href] : undefined;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            data-slot="sidebar-link"
            data-active={active}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            {HKIcon ? (
              <HKIcon className="size-4.5 shrink-0 text-primary" />
            ) : BatIcon ? (
              <BatIcon className="size-4.5 shrink-0 text-primary" />
            ) : (
              <Icon className="size-4.5 shrink-0" />
            )}
            {title}
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <SidebarNav />
      <div className="border-t px-5 py-4 text-xs text-muted-foreground">
        Stay consistent. Small wins compound daily. 📚
      </div>
    </aside>
  );
}
