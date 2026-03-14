package modifications

import (
	"context"

	"github.com/google/uuid"
)

type Service interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateModificationInput) (*Modification, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Modification, error)
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service {
	return &service{repo: r}
}

func (s *service) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateModificationInput) (*Modification, error) {
	return s.repo.Create(ctx, vehicleID, userID, in)
}

func (s *service) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Modification, error) {
	return s.repo.List(ctx, vehicleID, userID)
}
