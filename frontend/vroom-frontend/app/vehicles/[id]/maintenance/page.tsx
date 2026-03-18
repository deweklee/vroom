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

function toFormValues(r: MaintenanceRecord) {
  const isPreset = PRESET_TYPES.includes(r.service_type) && r.service_type !== "Custom…";
  return {
    service_type: isPreset ? r.service_type : "Custom…",
    custom_type: isPreset ? "" : r.service_type,
    service_date: r.service_date.split("T")[0],
    cost: r.cost != null ? String(r.cost) : "",
    odometer: r.odometer != null ? String(r.odometer) : "",
    shop: r.shop ?? "",
    notes: r.notes ?? "",
  };
}

export default function MaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isCustom = form.service_type === "Custom…";
  const resolvedType = isCustom ? form.custom_type : form.service_type;

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<MaintenanceRecord[] | null>(`/vehicles/${id}/maintenance`)
      .then((d) => setRecords(d ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
    setError("");
  }

  function openEdit(r: MaintenanceRecord) {
    setEditingId(r.id);
    setForm(toFormValues(r));
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedType) { setError("Service type is required"); return; }
    setSaving(true); setError("");
    const body = JSON.stringify({
      service_type: resolvedType,
      service_date: `${form.service_date}T00:00:00Z`,
      ...(form.cost && { cost: parseFloat(form.cost) }),
      ...(form.odometer && { odometer: parseInt(form.odometer) }),
      ...(form.shop && { shop: form.shop }),
      ...(form.notes && { notes: form.notes }),
    });
    try {
      if (editingId) {
        const updated = await apiFetch<MaintenanceRecord>(`/vehicles/${id}/maintenance/${editingId}`, { method: "PUT", body });
        setRecords((prev) => prev.map((rec) => rec.id === editingId ? updated : rec));
      } else {
        const rec = await apiFetch<MaintenanceRecord>(`/vehicles/${id}/maintenance`, { method: "POST", body });
        setRecords((prev) => [rec, ...prev]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(recordId: string) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await apiFetch(`/vehicles/${id}/maintenance/${recordId}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/vehicles/${id}`} className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">← Vehicle</Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <button onClick={showForm ? closeForm : openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            {showForm ? "Cancel" : "+ Add Record"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700">{editingId ? "Edit Record" : "New Record"}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-600">Service Type *</label>
                <select
                  value={form.service_type}
                  onChange={(e) => set("service_type", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a type…</option>
                  {PRESET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {isCustom && (
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-gray-600">Custom Service Type *</label>
                  <input
                    type="text"
                    value={form.custom_type}
                    onChange={(e) => set("custom_type", e.target.value)}
                    required
                    placeholder="e.g. Differential Fluid"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="min-w-0">
                <label className="mb-1 block text-xs text-gray-600">Date *</label>
                <input type="date" value={form.service_date} onChange={(e) => set("service_date", e.target.value)}
                  required className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-gray-600">Cost</label>
                <input type="number" step="any" value={form.cost} onChange={(e) => set("cost", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Odometer</label>
                <input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Shop</label>
                <input type="text" value={form.shop} onChange={(e) => set("shop", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-600">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save Changes" : "Save Record"}
            </button>
          </form>
        )}

        {error && !showForm && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-400">Loading…</p>}
        {!loading && records.length === 0 && <p className="text-gray-400">No maintenance records yet.</p>}

        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{r.service_type}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                    {r.shop && <span>{r.shop}</span>}
                    {r.odometer && <span>{r.odometer.toLocaleString()} mi</span>}
                    {r.notes && <span className="text-gray-400">{r.notes}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {r.cost != null && <p className="font-semibold text-green-600">${r.cost.toFixed(2)}</p>}
                  <p className="text-xs text-gray-400">{new Date(r.service_date).toLocaleDateString()}</p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => openEdit(r)}
                      className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDelete(r.id)}
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
