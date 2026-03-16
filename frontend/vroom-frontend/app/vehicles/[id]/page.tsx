"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Vehicle {
  id: string; make: string; model: string; year: number;
  vin?: string; purchase_price?: number; purchase_date?: string; current_mileage?: number;
}

interface Stats {
  avg_mpg?: number; total_fuel_cost: number; total_maintenance_cost: number;
  total_mod_cost: number; cost_per_mile?: number; last_updated: string;
}

interface FuelEntry {
  id: string; odometer: number; gallons: number;
  price_per_gallon: number; total_cost: number;
  fuel_date?: string; created_at: string;
}

interface ChartPoint {
  date: string;
  mpg?: number;
  cost: number;
}

function buildChartData(entries: FuelEntry[]): ChartPoint[] {
  const sorted = [...entries].sort((a, b) => a.odometer - b.odometer);
  return sorted.slice(1).map((entry, i) => {
    const prev = sorted[i];
    const miles = entry.odometer - prev.odometer;
    const mpg = miles > 0 && entry.gallons > 0 ? miles / entry.gallons : undefined;
    const date = new Date(entry.fuel_date ?? entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date, mpg: mpg ? parseFloat(mpg.toFixed(1)) : undefined, cost: entry.total_cost };
  });
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<Vehicle>(`/vehicles/${id}`).then(setVehicle).catch((e) => setError(e.message));
    apiFetch<Stats>(`/vehicles/${id}/stats`).then(setStats).catch(() => null);
    apiFetch<FuelEntry[] | null>(`/vehicles/${id}/fuel`)
      .then((data) => setChartData(buildChartData(data ?? [])))
      .catch(() => null);
  }, [id, router]);

  async function deleteVehicle() {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return;
    await apiFetch(`/vehicles/${id}`, { method: "DELETE" });
    router.push("/vehicles");
  }

  if (error) return <div className="min-h-screen bg-gray-50 p-8 text-red-500">{error}</div>;
  if (!vehicle) return <div className="min-h-screen bg-gray-50 p-8 text-gray-400">Loading…</div>;

  const nav = [
    { label: "Fuel", href: `/vehicles/${id}/fuel` },
    { label: "Maintenance", href: `/vehicles/${id}/maintenance` },
    { label: "Mods", href: `/vehicles/${id}/mods` },
  ];

  const tooltipStyle = { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/vehicles" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">← My Vehicles</Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
              {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
              {vehicle.current_mileage && <span>{vehicle.current_mileage.toLocaleString()} mi</span>}
              {vehicle.purchase_price && <span>Purchased for ${vehicle.purchase_price.toLocaleString()}</span>}
            </div>
          </div>
          <button onClick={deleteVehicle} className="text-sm text-red-500 hover:text-red-400">Delete</button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Avg MPG", value: stats.avg_mpg != null ? stats.avg_mpg.toFixed(1) : "—" },
              { label: "Fuel Cost", value: `$${stats.total_fuel_cost.toFixed(2)}` },
              { label: "Maintenance", value: `$${stats.total_maintenance_cost.toFixed(2)}` },
              { label: "Mods", value: `$${stats.total_mod_cost.toFixed(2)}` },
              { label: "Cost / Mile", value: stats.cost_per_mile != null ? `$${stats.cost_per_mile.toFixed(3)}` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}
        {!stats && <p className="mb-6 text-sm text-gray-400">No stats yet — log a fuel entry to start tracking.</p>}

        {/* Charts */}
        {chartData.length >= 1 && (
          <div className="mb-6 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-600">MPG per Fill-up</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} width={35} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#6b7280" }} />
                  <Line type="monotone" dataKey="mpg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-600">Fuel Cost per Fill-up</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} width={35} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#6b7280" }} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cost"]} />
                  <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sub-nav */}
        <div className="flex gap-3">
          {nav.map(({ label, href }) => (
            <Link key={label} href={href}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-4 text-center text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-shadow">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
