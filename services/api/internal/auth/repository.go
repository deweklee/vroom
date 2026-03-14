package auth

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetByEmail(ctx context.Context, email string) (*User, error)
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash
		FROM users
		WHERE email = $1
	`, email)

	var (
		id           uuid.UUID
		e            string
		passwordHash string
	)

	if err := row.Scan(&id, &e, &passwordHash); err != nil {
		return nil, err
	}

	return &User{
		ID:           id,
		Email:        e,
		PasswordHash: passwordHash,
	}, nil
}

