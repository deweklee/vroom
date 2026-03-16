import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
        <nav className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex justify-center items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/vroom-logo-2.png" alt="Vroom" width={56} height={56} />
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">Vroom</span>
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
