import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dokter Jaga Clinical",
  description: "Clinical intelligence workspace for doctors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
