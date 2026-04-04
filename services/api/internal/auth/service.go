package auth

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid email or password")
var ErrEmailTaken = errors.New("email already registered")

type Service interface {
	Login(ctx context.Context, email, password string) (*User, error)
	Register(ctx context.Context, email, password string) (*User, error)
	LoginWithGoogle(ctx context.Context, googleID, email string) (*User, error)
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
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return u, nil
}

func (s *service) Register(ctx context.Context, email, password string) (*User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u, err := s.repo.Create(ctx, email, string(hash))
	if err != nil {
		return nil, ErrEmailTaken
	}

	return u, nil
}

func (s *service) LoginWithGoogle(ctx context.Context, googleID, email string) (*User, error) {
	return s.repo.FindOrCreateByGoogle(ctx, googleID, email)
}

