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

function toFormValues(e: FuelEntry) {
  return {
    odometer: String(e.odometer),
    gallons: String(e.gallons),
    price_per_gallon: String(e.price_per_gallon),
    fuel_date: e.fuel_date ? e.fuel_date.split("T")[0] : today(),
    location: e.location ?? "",
  };
}

export default function FuelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<FuelEntry[] | null>(`/vehicles/${id}/fuel`)
      .then((d) => setEntries(d ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  function openCreate() {
    setEditingId(null);
    setForm(empty());
    setShowForm(true);
    setError("");
  }

  function openEdit(e: FuelEntry) {
    setEditingId(e.id);
    setForm(toFormValues(e));
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(empty());
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const body = JSON.stringify({
      odometer: parseInt(form.odometer),
      gallons: parseFloat(form.gallons),
      price_per_gallon: parseFloat(form.price_per_gallon),
      total_cost: parseFloat(form.gallons) * parseFloat(form.price_per_gallon),
      fuel_date: `${form.fuel_date}T00:00:00Z`,
      ...(form.location && { location: form.location }),
    });
    try {
      if (editingId) {
        const updated = await apiFetch<FuelEntry>(`/vehicles/${id}/fuel/${editingId}`, { method: "PUT", body });
        setEntries((prev) => prev.map((en) => en.id === editingId ? updated : en));
      } else {
        const entry = await apiFetch<FuelEntry>(`/vehicles/${id}/fuel`, { method: "POST", body });
        setEntries((prev) => [entry, ...prev]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!window.confirm("Delete this fill-up?")) return;
    try {
      await apiFetch(`/vehicles/${id}/fuel/${entryId}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/vehicles/${id}`} className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">← Vehicle</Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fuel Log</h1>
          <button onClick={showForm ? closeForm : openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            {showForm ? "Cancel" : "+ Add Fill-up"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700">{editingId ? "Edit Fill-up" : "New Fill-up"}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Odometer (mi) *", field: "odometer", type: "number" },
                { label: "Gallons *", field: "gallons", type: "number" },
                { label: "Price / Gal *", field: "price_per_gallon", type: "number" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-gray-600">{label}</label>
                  <input type={type} step="any" value={form[field as keyof typeof form]}
                    onChange={(e) => set(field, e.target.value)} required
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs text-gray-600">Total Cost</label>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500">
                  {form.gallons && form.price_per_gallon
                    ? `$${(parseFloat(form.gallons) * parseFloat(form.price_per_gallon)).toFixed(2)}`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-gray-600">Date</label>
                <input type="date" value={form.fuel_date} onChange={(e) => set("fuel_date", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-gray-600">Location</label>
                <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save Changes" : "Save Fill-up"}
            </button>
          </form>
        )}

        {error && !showForm && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-400">Loading…</p>}
        {!loading && entries.length === 0 && <p className="text-gray-400">No fill-ups logged yet.</p>}

        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{e.odometer.toLocaleString()} mi</p>
                  <p className="text-sm text-gray-500">{e.gallons} gal · ${e.price_per_gallon}/gal</p>
                  {e.location && <p className="text-sm text-gray-400">{e.location}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="font-semibold text-green-600">${e.total_cost.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.fuel_date ?? e.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => openEdit(e)}
                      className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDelete(e.id)}
                      className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
