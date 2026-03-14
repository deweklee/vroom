"""
Recalculates and upserts vehicle_stats for a given vehicle_id.

Called after any event that changes a vehicle's data. Always recomputes
everything from scratch so the result is always consistent and idempotent.
"""


async def update_vehicle_stats(pool, vehicle_id: str):
    async with pool.acquire() as conn:
        # --- Fuel stats ---
        fuel_rows = await conn.fetch(
            """
            SELECT odometer, gallons, total_cost
            FROM fuel_entries
            WHERE vehicle_id = $1
            ORDER BY odometer ASC
            """,
            vehicle_id,
        )

        total_fuel_cost = sum(float(r["total_cost"]) for r in fuel_rows)

        # MPG: for each consecutive pair of fill-ups, compute miles/gallons
        mpg_values = []
        for i in range(1, len(fuel_rows)):
            miles = fuel_rows[i]["odometer"] - fuel_rows[i - 1]["odometer"]
            gallons = float(fuel_rows[i]["gallons"])
            if miles > 0 and gallons > 0:
                mpg_values.append(miles / gallons)

        avg_mpg = sum(mpg_values) / len(mpg_values) if mpg_values else None

        # Total miles driven (odometer range across all fill-ups)
        if len(fuel_rows) >= 2:
            total_miles = fuel_rows[-1]["odometer"] - fuel_rows[0]["odometer"]
        else:
            total_miles = 0

        # --- Maintenance stats ---
        maintenance_row = await conn.fetchrow(
            """
            SELECT COALESCE(SUM(cost), 0) AS total
            FROM maintenance_records
            WHERE vehicle_id = $1
            """,
            vehicle_id,
        )
        total_maintenance_cost = float(maintenance_row["total"])

        # --- Modification stats ---
        mod_row = await conn.fetchrow(
            """
            SELECT COALESCE(SUM(cost), 0) AS total
            FROM modifications
            WHERE vehicle_id = $1
            """,
            vehicle_id,
        )
        total_mod_cost = float(mod_row["total"])

        # --- Cost per mile ---
        total_spend = total_fuel_cost + total_maintenance_cost + total_mod_cost
        cost_per_mile = total_spend / total_miles if total_miles > 0 else None

        # --- Upsert vehicle_stats ---
        await conn.execute(
            """
            INSERT INTO vehicle_stats
                (vehicle_id, avg_mpg, total_fuel_cost, total_maintenance_cost,
                 total_mod_cost, cost_per_mile, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (vehicle_id) DO UPDATE SET
                avg_mpg                = EXCLUDED.avg_mpg,
                total_fuel_cost        = EXCLUDED.total_fuel_cost,
                total_maintenance_cost = EXCLUDED.total_maintenance_cost,
                total_mod_cost         = EXCLUDED.total_mod_cost,
                cost_per_mile          = EXCLUDED.cost_per_mile,
                last_updated           = NOW()
            """,
            vehicle_id,
            avg_mpg,
            total_fuel_cost,
            total_maintenance_cost,
            total_mod_cost,
            cost_per_mile,
        )

        mpg_str = f"{avg_mpg:.1f}" if avg_mpg is not None else "n/a"
        cpm_str = f"${cost_per_mile:.3f}" if cost_per_mile is not None else "n/a"
        print(
            f"[stats] vehicle {vehicle_id} — "
            f"avg_mpg={mpg_str}, "
            f"fuel=${total_fuel_cost:.2f}, "
            f"maintenance=${total_maintenance_cost:.2f}, "
            f"mods=${total_mod_cost:.2f}, "
            f"cost_per_mile={cpm_str}"
        )
