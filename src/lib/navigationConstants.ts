/**
 * PROTECTED NAVIGATION CONSTANTS
 * 
 * All core app tabs and routes are defined here. 
 * DO NOT remove any entry marked as `protected: true` — these are essential app sections.
 * Any tab removal must be deliberate and reviewed.
 */

import {
  LayoutDashboard,
  Dumbbell,
  Library,
  Activity,
  MessageSquare,
  Shield,
  MoreHorizontal,
  UtensilsCrossed,
  UserCircle,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface VaultTab {
  id: string;
  label: string;
  icon: LucideIcon;
  protected: boolean; // If true, must never be accidentally removed
  adminOnly?: boolean;
}

/**
 * Core vault tabs — order matters for display.
 * Athlete IA: Today | Train | Nutrition | Coach (+ Body, Admin).
 * Retired areas (Community, Lifestyle, Podcast, Tracks, Fitness Audit) are no longer
 * listed in active navigation but their components and data remain intact.
 */
export const VAULT_TABS: VaultTab[] = [
  { id: "dashboard", label: "Today",     icon: LayoutDashboard,  protected: true },
  { id: "workouts",  label: "Train",     icon: Dumbbell,         protected: true },
  { id: "nutrition", label: "Nutrition", icon: UtensilsCrossed,  protected: true },
  { id: "coach",     label: "Coach",     icon: MessageSquare,    protected: true },
  { id: "progress",  label: "Body",      icon: Activity,         protected: true },
  { id: "admin",     label: "Admin",     icon: Shield,           protected: true, adminOnly: true },
];

/** Bottom navigation tabs for mobile — subset of core tabs */
export const BOTTOM_NAV_TABS: VaultTab[] = [
  { id: "dashboard", label: "Today",     icon: LayoutDashboard,  protected: true },
  { id: "workouts",  label: "Train",     icon: Dumbbell,         protected: true },
  { id: "nutrition", label: "Nutrition", icon: UtensilsCrossed,  protected: true },
  { id: "coach",     label: "Coach",     icon: MessageSquare,    protected: true },
  { id: "more",      label: "More",      icon: MoreHorizontal,   protected: true },
];

/** Items shown in the "More" bottom sheet grid */
export interface MoreMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** If set, navigates to this route instead of switching vault tab */
  route?: string;
  /** If true, switches to this vault tab id */
  tabId?: string;
  adminOnly?: boolean;
  destructive?: boolean;
  /** Visual grouping label */
  group?: string;
}

export const MORE_MENU_ITEMS: MoreMenuItem[] = [
  { id: "progress",   label: "Body",      icon: Activity,   tabId: "progress",  group: "Training" },
  { id: "library",    label: "Resources", icon: Library,    tabId: "library",   group: "Content" },
  { id: "profile",    label: "Profile",   icon: UserCircle, route: "/profile",  group: "Account" },
  { id: "admin",      label: "Admin",     icon: Shield,     tabId: "admin", adminOnly: true, group: "Account" },
  { id: "signout",    label: "Sign Out",  icon: LogOut,     destructive: true },
];

/** Top-level app routes */
export const APP_ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  RESET_PASSWORD: "/reset-password",
  RESULTS: "/results",
  AUDIT: "/audit",
  VAULT: "/vault",
  NUTRITION: "/nutrition",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_USER: "/admin/user/:userId",
  ADMIN_USER_WORKOUT: "/admin/user/:userId/build-workout",
  ADMIN_USER_CALENDAR: "/admin/user/:userId/calendar",
  ADMIN_TEMPLATES: "/admin/templates",
} as const;

/** App version / build info for admin regression tracking */
export const APP_VERSION = "1.8.0";
export const APP_BUILD_DATE = "2026-03-10";
