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
import VehicleStats from "@/components/VehicleStats";

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

function toEditForm(v: Vehicle) {
  return {
    make: v.make,
    model: v.model,
    year: String(v.year),
    vin: v.vin ?? "",
    purchase_price: v.purchase_price != null ? String(v.purchase_price) : "",
    purchase_date: v.purchase_date ? v.purchase_date.split("T")[0] : "",
    current_mileage: v.current_mileage != null ? String(v.current_mileage) : "",
  };
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [latestOdometer, setLatestOdometer] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<ReturnType<typeof toEditForm> | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<Vehicle>(`/vehicles/${id}`).then(setVehicle).catch((e) => setError(e.message));
    apiFetch<Stats>(`/vehicles/${id}/stats`)
      .then(setStats)
      .catch(() => null)
      .finally(() => setStatsLoading(false));
    apiFetch<FuelEntry[] | null>(`/vehicles/${id}/fuel`)
      .then((data) => {
        const entries = data ?? [];
        setChartData(buildChartData(entries));
        if (entries.length > 0) {
          setLatestOdometer(Math.max(...entries.map((e) => e.odometer)));
        }
      })
      .catch(() => null);
  }, [id, router]);

  function openEdit() {
    if (!vehicle) return;
    setEditForm(toEditForm(vehicle));
    setShowEdit(true);
    setEditError("");
  }

  function setField(field: string, value: string) {
    setEditForm((f) => f ? { ...f, [field]: value } : f);
  }

  async function handleUpdate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true); setEditError("");
    try {
      const updated = await apiFetch<Vehicle>(`/vehicles/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          make: editForm.make,
          model: editForm.model,
          year: parseInt(editForm.year),
          ...(editForm.vin && { vin: editForm.vin }),
          ...(editForm.purchase_price && { purchase_price: parseFloat(editForm.purchase_price) }),
          ...(editForm.purchase_date && { purchase_date: `${editForm.purchase_date}T00:00:00Z` }),
          ...(editForm.current_mileage && { current_mileage: parseInt(editForm.current_mileage) }),
        }),
      });
      setVehicle(updated);
      setShowEdit(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

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
              {latestOdometer != null
                ? <span>{latestOdometer.toLocaleString()} mi</span>
                : vehicle.current_mileage != null && <span>{vehicle.current_mileage.toLocaleString()} mi</span>
              }
              {vehicle.purchase_price && <span>Purchased for ${vehicle.purchase_price.toLocaleString()}</span>}
            </div>
            {vehicle.current_mileage != null && latestOdometer != null && (
              <p className="mt-1 text-xs text-gray-400">Tracking since {vehicle.current_mileage.toLocaleString()} mi</p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={openEdit} className="text-sm text-blue-500 hover:text-blue-700">Edit</button>
            <button onClick={deleteVehicle} className="text-sm text-red-500 hover:text-red-400">Delete</button>
          </div>
        </div>

        {/* Edit form */}
        {showEdit && editForm && (
          <form onSubmit={handleUpdate} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Edit Vehicle</p>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Make *</label>
                <input type="text" value={editForm.make} onChange={(e) => setField("make", e.target.value)} required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Model *</label>
                <input type="text" value={editForm.model} onChange={(e) => setField("model", e.target.value)} required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Year *</label>
                <input type="number" value={editForm.year} onChange={(e) => setField("year", e.target.value)} required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">VIN</label>
                <input type="text" value={editForm.vin} onChange={(e) => setField("vin", e.target.value)} placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Current Mileage</label>
                <input type="number" value={editForm.current_mileage} onChange={(e) => setField("current_mileage", e.target.value)} placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Purchase Price</label>
                <input type="number" step="any" value={editForm.purchase_price} onChange={(e) => setField("purchase_price", e.target.value)} placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="min-w-0 col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs text-gray-600">Purchase Date</label>
                <input type="date" value={editForm.purchase_date} onChange={(e) => setField("purchase_date", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setShowEdit(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Stats */}
        <VehicleStats stats={stats} loading={statsLoading} />

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
