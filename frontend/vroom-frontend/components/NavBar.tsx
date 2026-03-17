"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getToken, clearToken, onAuthChange } from "@/lib/auth";

export default function NavBar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
    return onAuthChange(() => setLoggedIn(!!getToken()));
  }, []);

  function logout() {
    clearToken();
    setLoggedIn(false);
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-4">
      <div className="relative flex items-center justify-center">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/vroom-logo-2.png" alt="Vroom" width={56} height={56} />
          <span className="text-4xl font-extrabold tracking-tight text-gray-900">Vroom</span>
        </Link>
        {loggedIn && (
          <button
            onClick={logout}
            className="absolute right-0 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Log out
          </button>
        )}
      </div>
    </nav>
  );
}
