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
  Heart,
  Radio,
  Users,
  Target,
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
 * The `protected` flag marks tabs that are critical to the app and must always be present.
 */
export const VAULT_TABS: VaultTab[] = [
  { id: "dashboard", label: "Home",      icon: LayoutDashboard, protected: true },
  { id: "workouts",  label: "Train",     icon: Dumbbell,        protected: true },
  { id: "library",   label: "Library",   icon: Library,         protected: true },
  { id: "progress",  label: "Progress",  icon: Activity,        protected: true },
  { id: "lifestyle", label: "Lifestyle", icon: Heart,           protected: true },
  { id: "podcast",   label: "Podcast",   icon: Radio,           protected: false },
  { id: "community", label: "Community", icon: Users,           protected: true },
  { id: "tracks",    label: "Tracks",    icon: Target,          protected: false },
  { id: "admin",     label: "Admin",     icon: Shield,          protected: true, adminOnly: true },
];

/** Bottom navigation tabs for mobile — subset of core tabs */
export const BOTTOM_NAV_TABS: VaultTab[] = [
  { id: "dashboard", label: "Home",      icon: LayoutDashboard, protected: true },
  { id: "workouts",  label: "Train",     icon: Dumbbell,        protected: true },
  { id: "progress",  label: "Progress",  icon: Activity,        protected: true },
  { id: "community", label: "Community", icon: Users,           protected: true },
  { id: "more",      label: "More",      icon: MoreHorizontal,  protected: true },
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
}

export const MORE_MENU_ITEMS: MoreMenuItem[] = [
  { id: "lifestyle",  label: "Lifestyle",  icon: Heart,            tabId: "lifestyle" },
  { id: "library",    label: "Library",    icon: Library,          tabId: "library" },
  { id: "podcast",    label: "Podcast",    icon: Radio,            tabId: "podcast" },
  { id: "tracks",     label: "Tracks",     icon: Target,           tabId: "tracks" },
  { id: "nutrition",  label: "Nutrition",  icon: UtensilsCrossed,  route: "/nutrition" },
  { id: "profile",    label: "Profile",    icon: UserCircle,       route: "/profile" },
  { id: "admin",      label: "Admin",      icon: Shield,           tabId: "admin", adminOnly: true },
  { id: "signout",    label: "Sign Out",   icon: LogOut,           destructive: true },
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
