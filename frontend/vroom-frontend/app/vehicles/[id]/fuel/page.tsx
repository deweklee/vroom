"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface FuelEntry {
  id: string; odometer: number; gallons: number;
  price_per_gallon: number; total_cost: number;
  fuel_date?: string; location?: string; created_at: string;
}

const today = () => new Date().toISOString().split("T")[0];
const empty = () => ({ odometer: "", gallons: "", price_per_gallon: "", fuel_date: today(), location: "" });

export default function FuelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<FuelEntry[] | null>(`/vehicles/${id}/fuel`).then((d) => setEntries(d ?? [])).catch((e) => setError(e.message));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const entry = await apiFetch<FuelEntry>(`/vehicles/${id}/fuel`, {
        method: "POST",
        body: JSON.stringify({
          odometer: parseInt(form.odometer),
          gallons: parseFloat(form.gallons),
          price_per_gallon: parseFloat(form.price_per_gallon),
          total_cost: parseFloat(form.gallons) * parseFloat(form.price_per_gallon),
          fuel_date: `${form.fuel_date}T00:00:00Z`,
          ...(form.location && { location: form.location }),
        }),
      });
      setEntries((prev) => [entry, ...prev]);
      setForm(empty()); setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href={`/vehicles/${id}`} className="mb-4 inline-block text-sm text-zinc-500 hover:text-white">← Vehicle</Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fuel Log</h1>
          <button onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
            {showForm ? "Cancel" : "+ Add Fill-up"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl bg-zinc-900 p-5">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Odometer (mi) *", field: "odometer", type: "number" },
                { label: "Gallons *", field: "gallons", type: "number" },
                { label: "Price / Gal *", field: "price_per_gallon", type: "number" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-zinc-400">{label}</label>
                  <input type={type} step="any" value={form[field as keyof typeof form]}
                    onChange={(e) => set(field, e.target.value)} required
                    className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Total Cost</label>
                <p className="rounded-lg bg-zinc-800 px-3 py-2 text-zinc-400">
                  {form.gallons && form.price_per_gallon
                    ? `$${(parseFloat(form.gallons) * parseFloat(form.price_per_gallon)).toFixed(2)}`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Date</label>
                <input type="date" value={form.fuel_date} onChange={(e) => set("fuel_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Location</label>
                <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving…" : "Save Fill-up"}
            </button>
          </form>
        )}

        {error && !showForm && <p className="text-red-400">{error}</p>}
        {entries.length === 0 && <p className="text-zinc-500">No fill-ups logged yet.</p>}

        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-xl bg-zinc-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{e.odometer.toLocaleString()} mi</p>
                  <p className="text-sm text-zinc-400">{e.gallons} gal · ${e.price_per_gallon}/gal</p>
                  {e.location && <p className="text-sm text-zinc-500">{e.location}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-400">${e.total_cost.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(e.fuel_date ?? e.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
