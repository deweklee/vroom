"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken, onAuthChange } from "@/lib/auth";

export default function HeroCTA() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
    return onAuthChange(() => setLoggedIn(!!getToken()));
  }, []);

  if (loggedIn) {
    return (
      <Link
        href="/vehicles"
        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-500 transition-colors"
      >
        See my vehicles →
      </Link>
    );
  }

  return (
    <div className="flex gap-4">
      <Link
        href="/register"
        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-500 transition-colors"
      >
        Get started
      </Link>
      <Link
        href="/login"
        className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        Sign in
      </Link>
    </div>
  );
}
