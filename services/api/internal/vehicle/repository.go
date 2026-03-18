package vehicle

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, in CreateVehicleInput) (*Vehicle, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error)
	GetStats(ctx context.Context, id uuid.UUID) (*VehicleStats, error)
	List(ctx context.Context, userID *uuid.UUID) ([]Vehicle, error)
	Update(ctx context.Context, id uuid.UUID, in UpdateVehicleInput) (*Vehicle, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, in CreateVehicleInput) (*Vehicle, error) {
	query := `
		INSERT INTO vehicles (user_id, make, model, year, vin, purchase_price, purchase_date, current_mileage)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, make, model, year, vin, purchase_price, purchase_date, current_mileage, created_at
	`
	row := r.pool.QueryRow(ctx, query,
		in.UserID,
		in.Make,
		in.Model,
		in.Year,
		in.VIN,
		in.PurchasePrice,
		in.PurchaseDate,
		in.CurrentMileage,
	)
	return scanVehicle(row)
}

func (r *pgxRepository) GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error) {
	query := `
		SELECT v.id, v.user_id, v.make, v.model, v.year, v.vin, v.purchase_price, v.purchase_date, v.current_mileage,
		       (SELECT MAX(fe.odometer) FROM fuel_entries fe WHERE fe.vehicle_id = v.id) AS latest_odometer,
		       v.created_at
		FROM vehicles v
		WHERE v.id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	return scanVehicleWithOdometer(row)
}

func (r *pgxRepository) List(ctx context.Context, userID *uuid.UUID) ([]Vehicle, error) {
	var rows pgx.Rows
	var err error
	if userID != nil {
		rows, err = r.pool.Query(ctx, `
			SELECT v.id, v.user_id, v.make, v.model, v.year, v.vin, v.purchase_price, v.purchase_date, v.current_mileage,
			       (SELECT MAX(fe.odometer) FROM fuel_entries fe WHERE fe.vehicle_id = v.id) AS latest_odometer,
			       v.created_at
			FROM vehicles v
			WHERE v.user_id = $1
			ORDER BY v.created_at DESC
		`, *userID)
	} else {
		rows, err = r.pool.Query(ctx, `
			SELECT v.id, v.user_id, v.make, v.model, v.year, v.vin, v.purchase_price, v.purchase_date, v.current_mileage,
			       (SELECT MAX(fe.odometer) FROM fuel_entries fe WHERE fe.vehicle_id = v.id) AS latest_odometer,
			       v.created_at
			FROM vehicles v
			ORDER BY v.created_at DESC
		`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Vehicle
	for rows.Next() {
		v, err := scanVehicleWithOdometer(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *v)
	}
	return out, rows.Err()
}

func (r *pgxRepository) Update(ctx context.Context, id uuid.UUID, in UpdateVehicleInput) (*Vehicle, error) {
	// Simple approach: fetch existing, apply patch in Go, then save full row.
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if in.Make != nil {
		existing.Make = *in.Make
	}
	if in.Model != nil {
		existing.Model = *in.Model
	}
	if in.Year != nil {
		existing.Year = *in.Year
	}
	if in.VIN != nil {
		existing.VIN = in.VIN
	}
	if in.PurchasePrice != nil {
		existing.PurchasePrice = in.PurchasePrice
	}
	if in.PurchaseDate != nil {
		existing.PurchaseDate = in.PurchaseDate
	}
	if in.CurrentMileage != nil {
		existing.CurrentMileage = in.CurrentMileage
	}

	_, err = r.pool.Exec(ctx, `
		UPDATE vehicles
		SET make = $1,
			model = $2,
			year = $3,
			vin = $4,
			purchase_price = $5,
			purchase_date = $6,
			current_mileage = $7
		WHERE id = $8
	`,
		existing.Make,
		existing.Model,
		existing.Year,
		existing.VIN,
		existing.PurchasePrice,
		existing.PurchaseDate,
		existing.CurrentMileage,
		existing.ID,
	)
	if err != nil {
		return nil, err
	}
	return existing, nil
}

func (r *pgxRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM vehicles WHERE id = $1`, id)
	return err
}

func (r *pgxRepository) GetStats(ctx context.Context, id uuid.UUID) (*VehicleStats, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT vehicle_id, avg_mpg, total_fuel_cost, total_maintenance_cost, total_mod_cost, cost_per_mile, last_updated
		FROM vehicle_stats
		WHERE vehicle_id = $1
	`, id)

	var s VehicleStats
	if err := row.Scan(
		&s.VehicleID,
		&s.AvgMPG,
		&s.TotalFuelCost,
		&s.TotalMaintenanceCost,
		&s.TotalModCost,
		&s.CostPerMile,
		&s.LastUpdated,
	); err != nil {
		return nil, err
	}
	return &s, nil
}

func scanVehicleWithOdometer(row pgx.Row) (*Vehicle, error) {
	var (
		id             uuid.UUID
		userID         uuid.UUID
		make           string
		model          string
		year           int
		vin            *string
		purchasePrice  *float64
		purchaseDate   *time.Time
		currentMileage *int
		latestOdometer *int
		createdAt      time.Time
	)
	if err := row.Scan(&id, &userID, &make, &model, &year, &vin, &purchasePrice, &purchaseDate, &currentMileage, &latestOdometer, &createdAt); err != nil {
		return nil, err
	}
	return &Vehicle{
		ID:             id,
		UserID:         userID,
		Make:           make,
		Model:          model,
		Year:           year,
		VIN:            vin,
		PurchasePrice:  purchasePrice,
		PurchaseDate:   purchaseDate,
		CurrentMileage: currentMileage,
		LatestOdometer: latestOdometer,
		CreatedAt:      createdAt,
	}, nil
}

func scanVehicle(row pgx.Row) (*Vehicle, error) {
	var (
		id             uuid.UUID
		userID         uuid.UUID
		make           string
		model          string
		year           int
		vin            *string
		purchasePrice  *float64
		purchaseDate   *time.Time
		currentMileage *int
		createdAt      time.Time
	)

	if err := row.Scan(
		&id,
		&userID,
		&make,
		&model,
		&year,
		&vin,
		&purchasePrice,
		&purchaseDate,
		&currentMileage,
		&createdAt,
	); err != nil {
		return nil, err
	}

	return &Vehicle{
		ID:             id,
		UserID:         userID,
		Make:           make,
		Model:          model,
		Year:           year,
		VIN:            vin,
		PurchasePrice:  purchasePrice,
		PurchaseDate:   purchaseDate,
		CurrentMileage: currentMileage,
		CreatedAt:      createdAt,
	}, nil
}
