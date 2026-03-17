package fuel

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrVehicleNotFound = errors.New("vehicle not found or access denied")
	ErrNotFound        = errors.New("entry not found or access denied")
)

type Repository interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateFuelEntryInput) (*FuelEntry, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]FuelEntry, error)
	Update(ctx context.Context, entryID, vehicleID, userID uuid.UUID, in CreateFuelEntryInput) (*FuelEntry, error)
	Delete(ctx context.Context, entryID, vehicleID, userID uuid.UUID) error
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateFuelEntryInput) (*FuelEntry, error) {
	// The INSERT only proceeds if the vehicle exists and belongs to the user.
	row := r.pool.QueryRow(ctx, `
		INSERT INTO fuel_entries (vehicle_id, fuel_date, odometer, gallons, price_per_gallon, total_cost, location)
		SELECT $1, $2, $3, $4, $5, $6, $7
		WHERE EXISTS (SELECT 1 FROM vehicles WHERE id = $1 AND user_id = $8)
		RETURNING id, vehicle_id, fuel_date, odometer, gallons, price_per_gallon, total_cost, location, created_at
	`, vehicleID, in.FuelDate, in.Odometer, in.Gallons, in.PricePerGallon, in.TotalCost, in.Location, userID)

	entry, err := scanFuelEntry(row)
	if err != nil {
		return nil, ErrVehicleNotFound
	}
	return entry, nil
}

func (r *pgxRepository) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]FuelEntry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT fe.id, fe.vehicle_id, fe.fuel_date, fe.odometer, fe.gallons,
		       fe.price_per_gallon, fe.total_cost, fe.location, fe.created_at
		FROM fuel_entries fe
		JOIN vehicles v ON v.id = fe.vehicle_id
		WHERE fe.vehicle_id = $1 AND v.user_id = $2
		ORDER BY fe.created_at DESC
	`, vehicleID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []FuelEntry
	for rows.Next() {
		e, err := scanFuelEntry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *pgxRepository) Update(ctx context.Context, entryID, vehicleID, userID uuid.UUID, in CreateFuelEntryInput) (*FuelEntry, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE fuel_entries
		SET fuel_date=$3, odometer=$4, gallons=$5, price_per_gallon=$6, total_cost=$7, location=$8
		WHERE id=$1 AND vehicle_id=$2
		  AND EXISTS (SELECT 1 FROM vehicles WHERE id=$2 AND user_id=$9)
		RETURNING id, vehicle_id, fuel_date, odometer, gallons, price_per_gallon, total_cost, location, created_at
	`, entryID, vehicleID, in.FuelDate, in.Odometer, in.Gallons, in.PricePerGallon, in.TotalCost, in.Location, userID)

	entry, err := scanFuelEntry(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return entry, nil
}

func (r *pgxRepository) Delete(ctx context.Context, entryID, vehicleID, userID uuid.UUID) error {
	cmd, err := r.pool.Exec(ctx, `
		DELETE FROM fuel_entries
		WHERE id=$1 AND vehicle_id=$2
		  AND EXISTS (SELECT 1 FROM vehicles WHERE id=$2 AND user_id=$3)
	`, entryID, vehicleID, userID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func scanFuelEntry(row pgx.Row) (*FuelEntry, error) {
	var (
		id             uuid.UUID
		vehicleID      uuid.UUID
		fuelDate       *time.Time
		odometer       int
		gallons        float64
		pricePerGallon float64
		totalCost      float64
		location       *string
		createdAt      time.Time
	)
	if err := row.Scan(&id, &vehicleID, &fuelDate, &odometer, &gallons, &pricePerGallon, &totalCost, &location, &createdAt); err != nil {
		return nil, err
	}
	return &FuelEntry{
		ID:             id,
		VehicleID:      vehicleID,
		FuelDate:       fuelDate,
		Odometer:       odometer,
		Gallons:        gallons,
		PricePerGallon: pricePerGallon,
		TotalCost:      totalCost,
		Location:       location,
		CreatedAt:      createdAt,
	}, nil
}
