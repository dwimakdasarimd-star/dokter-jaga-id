"use client";

import { useEffect } from "react";

const routes: Record<string, string> = {
  Beranda: "/",
  Pasien: "/patients",
  "Rekam Medis": "/records",
  Resep: "/prescriptions",
  "Clinical Assistant": "/clinical",
  Tools: "/tools",
  Template: "/templates",
  Jadwal: "/schedule",
  Laporan: "/reports",
  Pengaturan: "/settings",
};

export default function NavigationBridge() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button.nav-item") as HTMLButtonElement | null;
      if (!button) return;
      const label = button.textContent?.replace(/AI/g, "").replace(/\s+/g, " ").trim() || "";
      const route = routes[label];
      if (!route) return;
      event.preventDefault();
      window.location.href = route;
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
