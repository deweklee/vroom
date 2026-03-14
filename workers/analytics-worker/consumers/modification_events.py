import json
from services.stats import update_vehicle_stats


async def handle_modification_created(pool, msg):
    data = json.loads(msg.data.decode())
    vehicle_id = data["vehicle_id"]
    print(f"[modifications] modification.created → vehicle {vehicle_id}")
    await update_vehicle_stats(pool, vehicle_id)
