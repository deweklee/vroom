"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface MaintenanceRecord {
  id: string; service_type: string; service_date: string;
  cost?: number; odometer?: number; shop?: string; notes?: string;
}

const PRESET_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Air Filter",
  "Cabin Filter",
  "Coolant Flush",
  "Transmission Service",
  "Spark Plugs",
  "Battery Replacement",
  "Inspection",
  "Wiper Blades",
  "Custom…",
];

const empty = { service_type: "", custom_type: "", service_date: "", cost: "", odometer: "", shop: "", notes: "" };

export default function MaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isCustom = form.service_type === "Custom…";
  const resolvedType = isCustom ? form.custom_type : form.service_type;

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<MaintenanceRecord[] | null>(`/vehicles/${id}/maintenance`).then((d) => setRecords(d ?? [])).catch((e) => setError(e.message));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedType) { setError("Service type is required"); return; }
    setSaving(true); setError("");
    try {
      const rec = await apiFetch<MaintenanceRecord>(`/vehicles/${id}/maintenance`, {
        method: "POST",
        body: JSON.stringify({
          service_type: resolvedType,
          service_date: `${form.service_date}T00:00:00Z`,
          ...(form.cost && { cost: parseFloat(form.cost) }),
          ...(form.odometer && { odometer: parseInt(form.odometer) }),
          ...(form.shop && { shop: form.shop }),
          ...(form.notes && { notes: form.notes }),
        }),
      });
      setRecords((prev) => [rec, ...prev]);
      setForm(empty); setShowForm(false);
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
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <button onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
            {showForm ? "Cancel" : "+ Add Record"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl bg-zinc-900 p-5">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-zinc-400">Service Type *</label>
                <select
                  value={form.service_type}
                  onChange={(e) => set("service_type", e.target.value)}
                  required
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a type…</option>
                  {PRESET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {isCustom && (
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-zinc-400">Custom Service Type *</label>
                  <input
                    type="text"
                    value={form.custom_type}
                    onChange={(e) => set("custom_type", e.target.value)}
                    required
                    placeholder="e.g. Differential Fluid"
                    className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-zinc-400">Date *</label>
                <input type="date" value={form.service_date} onChange={(e) => set("service_date", e.target.value)}
                  required className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Cost</label>
                <input type="number" step="any" value={form.cost} onChange={(e) => set("cost", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Odometer</label>
                <input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Shop</label>
                <input type="text" value={form.shop} onChange={(e) => set("shop", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-zinc-400">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving…" : "Save Record"}
            </button>
          </form>
        )}

        {error && !showForm && <p className="text-red-400">{error}</p>}
        {records.length === 0 && <p className="text-zinc-500">No maintenance records yet.</p>}

        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl bg-zinc-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{r.service_type}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-400">
                    {r.shop && <span>{r.shop}</span>}
                    {r.odometer && <span>{r.odometer.toLocaleString()} mi</span>}
                    {r.notes && <span className="text-zinc-500">{r.notes}</span>}
                  </div>
                </div>
                <div className="text-right">
                  {r.cost != null && <p className="font-semibold text-green-400">${r.cost.toFixed(2)}</p>}
                  <p className="text-xs text-zinc-500">{new Date(r.service_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
