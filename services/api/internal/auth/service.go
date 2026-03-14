package auth

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

type Service interface {
	Login(ctx context.Context, email, password string) (*User, error)
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service {
	return &service{repo: r}
}

func (s *service) Login(ctx context.Context, email, password string) (*User, error) {
	u, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		// In real code we would distinguish not-found vs other errors;
		// for now, treat any error as invalid credentials.
		return nil, ErrInvalidCredentials
	}

	// Compare password hashes (simple SHA-256 for now; switch to bcrypt/argon2 later).
	sum := sha256.Sum256([]byte(password))
	providedHash := hex.EncodeToString(sum[:])

	if subtle.ConstantTimeCompare([]byte(providedHash), []byte(u.PasswordHash)) != 1 {
		return nil, ErrInvalidCredentials
	}

	return u, nil
}

