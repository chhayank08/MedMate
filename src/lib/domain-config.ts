/**
 * Domain-specific configurations and utilities
 * Enables dynamic content adaptation based on user's selected domain
 */

import { DOMAIN_SUBJECTS } from "./constants";
import { Briefcase, Wrench, BookOpen, Scale, Stethoscope, FlaskConical, Laptop, LucideIcon } from 'lucide-react';

export type DomainKey = keyof typeof DOMAIN_SUBJECTS;

export interface DomainConfig {
  id: DomainKey;
  name: string;
  icon: string;
  iconComponent: LucideIcon;
  color: string;
  placeholders: {
    quizTopic: string;
    summaryTopic: string;
    taskExample: string;
  };
}

export const DOMAIN_CONFIGS: Record<DomainKey, DomainConfig> = {
  medical: {
    id: "medical",
    name: "Medical",
    icon: "🩺",
    iconComponent: Stethoscope,
    color: "text-red-500",
    placeholders: {
      quizTopic: "ACE inhibitor side effects, Loop of Henle",
      summaryTopic: "Cardiac physiology",
      taskExample: "Review Pathology notes",
    },
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    icon: "⚙️",
    iconComponent: Wrench,
    color: "text-blue-500",
    placeholders: {
      quizTopic: "Bernoulli's equation, Stress-strain analysis",
      summaryTopic: "Thermodynamics laws",
      taskExample: "Complete mechanics problem set",
    },
  },
  computer_science: {
    id: "computer_science",
    name: "Computer Science",
    icon: "💻",
    iconComponent: Laptop,
    color: "text-green-500",
    placeholders: {
      quizTopic: "Binary trees, Sorting algorithms, TCP/IP protocol",
      summaryTopic: "Database normalization",
      taskExample: "Implement binary search algorithm",
    },
  },
  business: {
    id: "business",
    name: "Business",
    icon: "💼",
    iconComponent: Briefcase,
    color: "text-purple-500",
    placeholders: {
      quizTopic: "Porter's Five Forces, SWOT analysis",
      summaryTopic: "Balance sheet fundamentals",
      taskExample: "Review financial statements",
    },
  },
  law: {
    id: "law",
    name: "Law",
    icon: "⚖️",
    iconComponent: Scale,
    color: "text-amber-500",
    placeholders: {
      quizTopic: "Contract formation elements, Tort liability",
      summaryTopic: "Constitutional amendments",
      taskExample: "Read case briefs",
    },
  },
  science: {
    id: "science",
    name: "Science",
    icon: "🔬",
    iconComponent: FlaskConical,
    color: "text-cyan-500",
    placeholders: {
      quizTopic: "Periodic table trends, Newton's laws",
      summaryTopic: "Cellular respiration",
      taskExample: "Lab report analysis",
    },
  },
  humanities: {
    id: "humanities",
    name: "Humanities",
    icon: "📚",
    iconComponent: BookOpen,
    color: "text-pink-500",
    placeholders: {
      quizTopic: "Renaissance art, World War II events",
      summaryTopic: "Shakespearean themes",
      taskExample: "Read chapter on ancient civilizations",
    },
  },
};

export function getActiveDomain(): DomainKey {
  if (typeof window === "undefined") return "medical";
  try {
    const stored = localStorage.getItem("prepbud:active-domain") as DomainKey;
    return stored && DOMAIN_CONFIGS[stored] ? stored : "medical";
  } catch {
    return "medical";
  }
}

export function setActiveDomain(domain: DomainKey): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("prepbud:active-domain", domain);
}

export function getDomainConfig(domain?: DomainKey): DomainConfig {
  const key = domain || getActiveDomain();
  return DOMAIN_CONFIGS[key] || DOMAIN_CONFIGS.medical;
}

export function getDomainSubjects(domain?: DomainKey): readonly string[] {
  const key = domain || getActiveDomain();
  return DOMAIN_SUBJECTS[key] || DOMAIN_SUBJECTS.medical;
}
