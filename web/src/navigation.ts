import {
  CarFront,
  ChartLine,
  Cog,
  Cpu,
  Disc3,
  House,
  MessageSquare,
  MoveVertical,
  Radio,
  Route,
  Rows3,
  SlidersHorizontal,
  Wrench,
} from "@lucide/vue";
import type { Component } from "vue";

/** `color` is the team's colour token. `phone` puts the entry in the phone's tab bar too. */
export type NavItem = {
  label: string;
  to: string;
  icon: Component;
  color?: string;
  phone?: boolean;
};

/** An entry shows up in the app as soon as its page exists in src/pages. */
export const mainNav: NavItem[] = [
  { label: "Home", to: "/", icon: House, phone: true },
  { label: "Live", to: "/live", icon: Radio, phone: true },
  { label: "Runs", to: "/runs", icon: Rows3, phone: true },
  { label: "Charts", to: "/charts", icon: ChartLine },
  { label: "Notes", to: "/notes", icon: MessageSquare, phone: true },
  { label: "Setups", to: "/setups", icon: SlidersHorizontal },
  { label: "Car", to: "/car", icon: CarFront, phone: true },
];

export const teamNav: NavItem[] = [
  { label: "Suspension", to: "/teams/suspension", icon: MoveVertical, color: "suspension" },
  { label: "Powertrain", to: "/teams/powertrain", icon: Cog, color: "powertrain" },
  { label: "Brakes", to: "/teams/brakes", icon: Disc3, color: "brakes" },
  { label: "Drivers", to: "/teams/drivers", icon: Route, color: "drivers" },
  { label: "Electronics", to: "/teams/electronics", icon: Cpu, color: "electronics" },
  { label: "Chassis", to: "/teams/chassis", icon: Wrench, color: "chassis" },
];

/** The car the app shows, until the server knows several cars. */
export const car = { number: "57", name: "2026 car" };
