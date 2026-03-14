"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  current_mileage?: number;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<Vehicle[] | null>("/vehicles")
      .then((data) => setVehicles(data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Vehicles</h1>
          <div className="flex gap-3">
            <Link href="/vehicles/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
              + Add Vehicle
            </Link>
            <button onClick={logout} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:text-white">
              Log out
            </button>
          </div>
        </div>

        {loading && <p className="text-zinc-500">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && vehicles.length === 0 && (
          <p className="text-zinc-500">No vehicles yet. Add one to get started.</p>
        )}

        <div className="space-y-3">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/vehicles/${v.id}`}
              className="block rounded-xl bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors">
              <p className="text-lg font-semibold">{v.year} {v.make} {v.model}</p>
              <div className="mt-1 flex gap-4 text-sm text-zinc-500">
                {v.vin && <span>VIN: {v.vin}</span>}
                {v.current_mileage && <span>{v.current_mileage.toLocaleString()} mi</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
