package modifications

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
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateModificationInput) (*Modification, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Modification, error)
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateModificationInput) (*Modification, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO modifications (vehicle_id, name, category, cost, install_date, notes)
		SELECT $1, $2, $3, $4, $5, $6
		WHERE EXISTS (SELECT 1 FROM vehicles WHERE id = $1 AND user_id = $7)
		RETURNING id, vehicle_id, name, category, cost, install_date, notes, created_at
	`, vehicleID, in.Name, in.Category, in.Cost, in.InstallDate, in.Notes, userID)

	mod, err := scanModification(row)
	if err != nil {
		return nil, ErrVehicleNotFound
	}
	return mod, nil
}

func (r *pgxRepository) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Modification, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT m.id, m.vehicle_id, m.name, m.category, m.cost, m.install_date, m.notes, m.created_at
		FROM modifications m
		JOIN vehicles v ON v.id = m.vehicle_id
		WHERE m.vehicle_id = $1 AND v.user_id = $2
		ORDER BY m.created_at DESC
	`, vehicleID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Modification
	for rows.Next() {
		mod, err := scanModification(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *mod)
	}
	return out, rows.Err()
}

func scanModification(row pgx.Row) (*Modification, error) {
	var (
		id          uuid.UUID
		vehicleID   uuid.UUID
		name        string
		category    *string
		cost        *float64
		installDate *time.Time
		notes       *string
		createdAt   time.Time
	)
	if err := row.Scan(&id, &vehicleID, &name, &category, &cost, &installDate, &notes, &createdAt); err != nil {
		return nil, err
	}
	return &Modification{
		ID:          id,
		VehicleID:   vehicleID,
		Name:        name,
		Category:    category,
		Cost:        cost,
		InstallDate: installDate,
		Notes:       notes,
		CreatedAt:   createdAt,
	}, nil
}
