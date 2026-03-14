import json
from services.stats import update_vehicle_stats


async def handle_fuel_created(pool, msg):
    data = json.loads(msg.data.decode())
    vehicle_id = data["vehicle_id"]
    print(f"[fuel] fuel.entry.created → vehicle {vehicle_id}")
    await update_vehicle_stats(pool, vehicle_id)
