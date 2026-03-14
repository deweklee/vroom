package maintenance

import (
	"context"

	"github.com/google/uuid"
)

type Service interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Record, error)
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service {
	return &service{repo: r}
}

func (s *service) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error) {
	return s.repo.Create(ctx, vehicleID, userID, in)
}

func (s *service) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Record, error) {
	return s.repo.List(ctx, vehicleID, userID)
}
