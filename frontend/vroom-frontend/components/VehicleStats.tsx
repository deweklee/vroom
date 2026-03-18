interface Stats {
  avg_mpg?: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_mod_cost: number;
  cost_per_mile?: number;
  last_updated: string;
}

interface Props {
  stats: Stats | null;
  loading: boolean;
}

export default function VehicleStats({ stats, loading }: Props) {
  if (loading) {
    return <p className="mb-6 text-sm text-gray-400">Loading stats…</p>;
  }

  if (!stats) {
    return <p className="mb-6 text-sm text-gray-400">No stats yet — log a fuel entry to start tracking.</p>;
  }

  const items = [
    { label: "Avg MPG", value: stats.avg_mpg != null ? stats.avg_mpg.toFixed(1) : "—" },
    { label: "Fuel Cost", value: `$${stats.total_fuel_cost.toFixed(2)}` },
    { label: "Maintenance", value: `$${stats.total_maintenance_cost.toFixed(2)}` },
    { label: "Mods", value: `$${stats.total_mod_cost.toFixed(2)}` },
    { label: "Cost / Mile", value: stats.cost_per_mile != null ? `$${stats.cost_per_mile.toFixed(3)}` : "—" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
