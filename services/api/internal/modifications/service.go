package modifications

import (
	"context"
	"time"

	"github.com/google/uuid"
	"vroom-api/internal/events"
)

type Service interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateModificationInput) (*Modification, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Modification, error)
}

type service struct {
	repo      Repository
	publisher events.Publisher
}

func NewService(r Repository, pub events.Publisher) Service {
	return &service{repo: r, publisher: pub}
}

func (s *service) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateModificationInput) (*Modification, error) {
	mod, err := s.repo.Create(ctx, vehicleID, userID, in)
	if err != nil {
		return nil, err
	}
	s.publisher.Publish("modification.created", map[string]any{
		"modification_id": mod.ID,
		"vehicle_id":      mod.VehicleID,
		"user_id":         userID,
		"timestamp":       time.Now().UTC(),
	})
	return mod, nil
}

func (s *service) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Modification, error) {
	return s.repo.List(ctx, vehicleID, userID)
}
