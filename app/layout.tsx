import type { Metadata } from "next";
import "./globals.css";
import "./tools/tools.css";

export const metadata: Metadata = {
  title: "Dokter Jaga — Clinical Assistant untuk Dokter",
  description: "Clinical workspace untuk membantu dokter umum bekerja di IGD dan poliklinik.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
