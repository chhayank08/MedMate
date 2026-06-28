/**
 * Domain-specific configurations and utilities
 * Enables dynamic content adaptation based on user's selected domain
 * 
 * This module provides:
 * - Domain configurations with icons, colors, and placeholders
 * - Utility functions for domain management
 * - Type-safe domain operations
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
  description: string;
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
    description: "Medical education and healthcare",
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
    description: "Engineering principles and problem-solving",
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
    description: "Technology and computer science",
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
    description: "Business strategy and management",
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
    description: "Legal studies and jurisprudence",
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
    description: "Natural sciences and research",
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
    description: "Arts, history, and human culture",
    placeholders: {
      quizTopic: "Renaissance art, World War II events",
      summaryTopic: "Shakespearean themes",
      taskExample: "Read chapter on ancient civilizations",
    },
  },
};

/**
 * Get active domain from localStorage with fallback
 * @returns The active domain key
 */
export function getActiveDomain(): DomainKey {
  if (typeof window === "undefined") return "medical";
  try {
    // Try new format first
    const selectedDomains = localStorage.getItem("prepbud:selected-domains");
    if (selectedDomains) {
      const parsed = JSON.parse(selectedDomains);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Domain IDs are stored, need to map to keys
        // For now, fall through to legacy format
      }
    }
    
    // Legacy format
    const stored = localStorage.getItem("prepbud:active-domain") as DomainKey;
    return stored && DOMAIN_CONFIGS[stored] ? stored : "medical";
  } catch {
    return "medical";
  }
}

/**
 * Set active domain in localStorage
 * @param domain - The domain key to set as active
 */
export function setActiveDomain(domain: DomainKey): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("prepbud:active-domain", domain);
}

/**
 * Get domain configuration by key
 * @param domain - Optional domain key, defaults to active domain
 * @returns Domain configuration object
 */
export function getDomainConfig(domain?: DomainKey): DomainConfig {
  const key = domain || getActiveDomain();
  return DOMAIN_CONFIGS[key] || DOMAIN_CONFIGS.medical;
}

/**
 * Get subjects for a specific domain
 * @param domain - Optional domain key, defaults to active domain
 * @returns Array of subject names
 */
export function getDomainSubjects(domain?: DomainKey): readonly string[] {
  const key = domain || getActiveDomain();
  return DOMAIN_SUBJECTS[key] || DOMAIN_SUBJECTS.medical;
}

/**
 * Get all available domain keys
 * @returns Array of all domain keys
 */
export function getAllDomainKeys(): DomainKey[] {
  return Object.keys(DOMAIN_CONFIGS) as DomainKey[];
}

/**
 * Get all domain configurations
 * @returns Array of all domain configs
 */
export function getAllDomainConfigs(): DomainConfig[] {
  return Object.values(DOMAIN_CONFIGS);
}

/**
 * Check if a string is a valid domain key
 * @param key - String to validate
 * @returns True if valid domain key
 */
export function isValidDomainKey(key: string): key is DomainKey {
  return key in DOMAIN_CONFIGS;
}
