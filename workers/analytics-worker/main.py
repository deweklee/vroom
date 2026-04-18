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
    js = await nc.jetstream()

    async def on_fuel(msg):
        await handle_fuel_created(pool, msg)
        await msg.ack()

    async def on_maintenance(msg):
        await handle_maintenance_created(pool, msg)
        await msg.ack()

    async def on_modification(msg):
        await handle_modification_created(pool, msg)
        await msg.ack()

    # Durable push consumers — messages queue up on disk if the worker is down
    # and are delivered when it reconnects.
    await js.subscribe("fuel.entry.created", durable="analytics-fuel", cb=on_fuel)
    await js.subscribe("maintenance.record.created", durable="analytics-maintenance", cb=on_maintenance)
    await js.subscribe("modification.created", durable="analytics-modification", cb=on_modification)

    print(f"[worker] connected to NATS JetStream at {nats_url}")
    print("[worker] subscribed (durable) to: fuel.entry.created, maintenance.record.created, modification.created")

    try:
        await asyncio.Event().wait()  # run forever
    except KeyboardInterrupt:
        pass
    finally:
        await nc.drain()
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
