"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function NewVehiclePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    make: "", model: "", year: "", vin: "", purchase_price: "", purchase_date: "", current_mileage: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: parseInt(form.year),
          ...(form.vin && { vin: form.vin }),
          ...(form.purchase_price && { purchase_price: parseFloat(form.purchase_price) }),
          ...(form.purchase_date && { purchase_date: `${form.purchase_date}T00:00:00Z` }),
          ...(form.current_mileage && { current_mileage: parseInt(form.current_mileage) }),
        }),
      });
      router.push("/vehicles");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/vehicles" className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-900">← Back</Link>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Vehicle</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {[
            { label: "Make", field: "make", required: true, placeholder: "Toyota" },
            { label: "Model", field: "model", required: true, placeholder: "Camry" },
            { label: "Year", field: "year", required: true, placeholder: "2020", type: "number" },
            { label: "VIN", field: "vin", placeholder: "Optional" },
            { label: "Purchase Price", field: "purchase_price", placeholder: "Optional", type: "number" },
            { label: "Current Mileage", field: "current_mileage", placeholder: "Optional", type: "number" },
          ].map(({ label, field, required, placeholder, type }) => (
            <div key={field}>
              <label className="mb-1 block text-sm text-gray-600">{label}{required && " *"}</label>
              <input
                type={type ?? "text"}
                value={form[field as keyof typeof form]}
                onChange={(e) => set(field, e.target.value)}
                required={required}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm text-gray-600">Purchase Date</label>
            <input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {loading ? "Saving…" : "Add Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}
