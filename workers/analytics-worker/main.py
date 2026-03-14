import asyncio
import os

import asyncpg
import nats

from consumers.fuel_events import handle_fuel_created
from consumers.maintenance_events import handle_maintenance_created
from consumers.modification_events import handle_modification_created


async def main():
    nats_url = os.getenv("NATS_URL", "nats://localhost:4222")
    db_url = os.getenv("DATABASE_URL", "postgres://vroom:vroom@localhost:5432/vroom")

    # asyncpg requires postgresql:// scheme
    db_url = db_url.replace("postgres://", "postgresql://", 1)

    pool = await asyncpg.create_pool(db_url)
    nc = await nats.connect(nats_url)

    async def on_fuel(msg):
        await handle_fuel_created(pool, msg)

    async def on_maintenance(msg):
        await handle_maintenance_created(pool, msg)

    async def on_modification(msg):
        await handle_modification_created(pool, msg)

    await nc.subscribe("fuel.entry.created", cb=on_fuel)
    await nc.subscribe("maintenance.record.created", cb=on_maintenance)
    await nc.subscribe("modification.created", cb=on_modification)

    print(f"[worker] connected to NATS at {nats_url}")
    print("[worker] subscribed to: fuel.entry.created, maintenance.record.created, modification.created")

    try:
        await asyncio.Event().wait()  # run forever
    except KeyboardInterrupt:
        pass
    finally:
        await nc.drain()
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
