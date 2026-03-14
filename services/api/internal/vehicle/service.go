package vehicle

import (
	"context"

	"github.com/google/uuid"
)

type Service interface {
	Create(ctx context.Context, in CreateVehicleInput) (*Vehicle, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error)
	List(ctx context.Context, userID *uuid.UUID) ([]Vehicle, error)
	Update(ctx context.Context, id uuid.UUID, in UpdateVehicleInput) (*Vehicle, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service {
	return &service{repo: r}
}

func (s *service) Create(ctx context.Context, in CreateVehicleInput) (*Vehicle, error) {
	return s.repo.Create(ctx, in)
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, userID *uuid.UUID) ([]Vehicle, error) {
	return s.repo.List(ctx, userID)
}

func (s *service) Update(ctx context.Context, id uuid.UUID, in UpdateVehicleInput) (*Vehicle, error) {
	return s.repo.Update(ctx, id, in)
}

func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
