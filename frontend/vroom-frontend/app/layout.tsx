import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vroom",
  description: "Vehicle ownership tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
