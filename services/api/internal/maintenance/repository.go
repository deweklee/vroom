package maintenance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrVehicleNotFound = errors.New("vehicle not found or access denied")

type Repository interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Record, error)
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO maintenance_records (vehicle_id, service_type, odometer, cost, shop, notes, service_date)
		SELECT $1, $2, $3, $4, $5, $6, $7
		WHERE EXISTS (SELECT 1 FROM vehicles WHERE id = $1 AND user_id = $8)
		RETURNING id, vehicle_id, service_type, odometer, cost, shop, notes, service_date, created_at
	`, vehicleID, in.ServiceType, in.Odometer, in.Cost, in.Shop, in.Notes, in.ServiceDate, userID)

	rec, err := scanRecord(row)
	if err != nil {
		return nil, ErrVehicleNotFound
	}
	return rec, nil
}

func (r *pgxRepository) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Record, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT mr.id, mr.vehicle_id, mr.service_type, mr.odometer, mr.cost,
		       mr.shop, mr.notes, mr.service_date, mr.created_at
		FROM maintenance_records mr
		JOIN vehicles v ON v.id = mr.vehicle_id
		WHERE mr.vehicle_id = $1 AND v.user_id = $2
		ORDER BY mr.service_date DESC
	`, vehicleID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Record
	for rows.Next() {
		rec, err := scanRecord(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *rec)
	}
	return out, rows.Err()
}

func scanRecord(row pgx.Row) (*Record, error) {
	var (
		id          uuid.UUID
		vehicleID   uuid.UUID
		serviceType string
		odometer    *int
		cost        *float64
		shop        *string
		notes       *string
		serviceDate time.Time
		createdAt   time.Time
	)
	if err := row.Scan(&id, &vehicleID, &serviceType, &odometer, &cost, &shop, &notes, &serviceDate, &createdAt); err != nil {
		return nil, err
	}
	return &Record{
		ID:          id,
		VehicleID:   vehicleID,
		ServiceType: serviceType,
		Odometer:    odometer,
		Cost:        cost,
		Shop:        shop,
		Notes:       notes,
		ServiceDate: serviceDate,
		CreatedAt:   createdAt,
	}, nil
}
