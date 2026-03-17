"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Modification {
  id: string; name: string; category?: string;
  cost?: number; install_date?: string; notes?: string;
}

const CATEGORIES = [
  "Performance",
  "Cosmetic",
  "Audio",
  "Suspension",
  "Wheels & Tires",
  "Lighting",
  "Interior",
  "Safety",
  "Other",
];

const empty = { name: "", category: "", cost: "", install_date: "", notes: "" };

function toFormValues(m: Modification) {
  return {
    name: m.name,
    category: m.category ?? "",
    cost: m.cost != null ? String(m.cost) : "",
    install_date: m.install_date ? m.install_date.split("T")[0] : "",
    notes: m.notes ?? "",
  };
}

export default function ModsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mods, setMods] = useState<Modification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<Modification[] | null>(`/vehicles/${id}/mods`)
      .then((d) => setMods(d ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
    setError("");
  }

  function openEdit(m: Modification) {
    setEditingId(m.id);
    setForm(toFormValues(m));
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
    setSaving(true); setError("");
    const body = JSON.stringify({
      name: form.name,
      ...(form.category && { category: form.category }),
      ...(form.cost && { cost: parseFloat(form.cost) }),
      ...(form.install_date && { install_date: `${form.install_date}T00:00:00Z` }),
      ...(form.notes && { notes: form.notes }),
    });
    try {
      if (editingId) {
        const updated = await apiFetch<Modification>(`/vehicles/${id}/mods/${editingId}`, { method: "PUT", body });
        setMods((prev) => prev.map((m) => m.id === editingId ? updated : m));
      } else {
        const mod = await apiFetch<Modification>(`/vehicles/${id}/mods`, { method: "POST", body });
        setMods((prev) => [mod, ...prev]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(modId: string) {
    if (!window.confirm("Delete this modification?")) return;
    try {
      await apiFetch(`/vehicles/${id}/mods/${modId}`, { method: "DELETE" });
      setMods((prev) => prev.filter((m) => m.id !== modId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/vehicles/${id}`} className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">← Vehicle</Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Modifications</h1>
          <button onClick={showForm ? closeForm : openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            {showForm ? "Cancel" : "+ Add Mod"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700">{editingId ? "Edit Modification" : "New Modification"}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-600">Name *</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  required placeholder="Cold Air Intake"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">None</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Cost</label>
                <input type="number" step="any" value={form.cost} onChange={(e) => set("cost", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Install Date</label>
                <input type="date" value={form.install_date} onChange={(e) => set("install_date", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save Changes" : "Save Mod"}
            </button>
          </form>
        )}

        {error && !showForm && <p className="text-red-500">{error}</p>}
        {loading && <p className="text-gray-400">Loading…</p>}
        {!loading && mods.length === 0 && <p className="text-gray-400">No modifications logged yet.</p>}

        <div className="space-y-3">
          {mods.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                    {m.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{m.category}</span>}
                    {m.notes && <span className="text-gray-400">{m.notes}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {m.cost != null && <p className="font-semibold text-green-600">${m.cost.toFixed(2)}</p>}
                  {m.install_date && <p className="text-xs text-gray-400">{new Date(m.install_date).toLocaleDateString()}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => openEdit(m)}
                      className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDelete(m.id)}
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
