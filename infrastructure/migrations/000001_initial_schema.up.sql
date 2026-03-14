-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    vin TEXT,
    purchase_price NUMERIC,
    purchase_date DATE,
    current_mileage INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

-- fuel_entries
CREATE TABLE fuel_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fuel_date DATE,
    odometer INT NOT NULL,
    gallons NUMERIC NOT NULL,
    price_per_gallon NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_entries_vehicle_id ON fuel_entries(vehicle_id);

-- maintenance_records
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    odometer INT,
    cost NUMERIC,
    shop TEXT,
    notes TEXT,
    service_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);

-- modifications
CREATE TABLE modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    cost NUMERIC,
    install_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modifications_vehicle_id ON modifications(vehicle_id);

-- vehicle_stats (populated by analytics worker)
CREATE TABLE vehicle_stats (
    vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
    avg_mpg NUMERIC,
    total_fuel_cost NUMERIC,
    total_maintenance_cost NUMERIC,
    total_mod_cost NUMERIC,
    cost_per_mile NUMERIC,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
