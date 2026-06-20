import {
  LayoutDashboard,
  ListChecks,
  Brain,
  FileText,
  CalendarRange,
  LineChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: ListChecks },
  { title: "Quizzes", href: "/quizzes", icon: Brain },
  { title: "Summaries", href: "/summaries", icon: FileText },
  { title: "Study Planner", href: "/planner", icon: CalendarRange },
  { title: "Analytics", href: "/analytics", icon: LineChart },
  { title: "Settings", href: "/settings", icon: Settings },
];
