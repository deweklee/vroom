package auth

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetByEmail(ctx context.Context, email string) (*User, error)
	Create(ctx context.Context, email, passwordHash string) (*User, error)
	FindOrCreateByGoogle(ctx context.Context, googleID, email string) (*User, error)
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, email, passwordHash string) (*User, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id, email, password_hash
	`, email, passwordHash)

	var (
		id   uuid.UUID
		e    string
		ph   string
	)
	if err := row.Scan(&id, &e, &ph); err != nil {
		return nil, err
	}
	return &User{ID: id, Email: e, PasswordHash: ph}, nil
}

func (r *pgxRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, COALESCE(password_hash, ''), google_id
		FROM users
		WHERE email = $1
	`, email)

	var (
		id           uuid.UUID
		e            string
		passwordHash string
		googleID     *string
	)

	if err := row.Scan(&id, &e, &passwordHash, &googleID); err != nil {
		return nil, err
	}

	return &User{
		ID:           id,
		Email:        e,
		PasswordHash: passwordHash,
		GoogleID:     googleID,
	}, nil
}

// FindOrCreateByGoogle looks up a user by google_id, falls back to email match,
// or creates a new user if neither exists.
func (r *pgxRepository) FindOrCreateByGoogle(ctx context.Context, googleID, email string) (*User, error) {
	// 1. Try by google_id
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, COALESCE(password_hash, ''), google_id
		FROM users WHERE google_id = $1
	`, googleID)
	u, err := scanUser(row)
	if err == nil {
		return u, nil
	}

	// 2. Try by email — link the google_id to the existing account
	row = r.pool.QueryRow(ctx, `
		UPDATE users SET google_id = $1 WHERE email = $2
		RETURNING id, email, COALESCE(password_hash, ''), google_id
	`, googleID, email)
	u, err = scanUser(row)
	if err == nil {
		return u, nil
	}

	// 3. Create new user (no password)
	row = r.pool.QueryRow(ctx, `
		INSERT INTO users (email, google_id)
		VALUES ($1, $2)
		RETURNING id, email, COALESCE(password_hash, ''), google_id
	`, email, googleID)
	return scanUser(row)
}

func scanUser(row interface{ Scan(...any) error }) (*User, error) {
	var (
		id           uuid.UUID
		e            string
		passwordHash string
		googleID     *string
	)
	if err := row.Scan(&id, &e, &passwordHash, &googleID); err != nil {
		return nil, err
	}
	return &User{ID: id, Email: e, PasswordHash: passwordHash, GoogleID: googleID}, nil
}

