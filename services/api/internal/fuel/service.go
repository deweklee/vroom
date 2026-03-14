package fuel

import (
	"context"
	"time"

	"github.com/google/uuid"
	"vroom-api/internal/events"
)

type Service interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateFuelEntryInput) (*FuelEntry, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]FuelEntry, error)
}

type service struct {
	repo      Repository
	publisher events.Publisher
}

func NewService(r Repository, pub events.Publisher) Service {
	return &service{repo: r, publisher: pub}
}

func (s *service) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateFuelEntryInput) (*FuelEntry, error) {
	entry, err := s.repo.Create(ctx, vehicleID, userID, in)
	if err != nil {
		return nil, err
	}
	s.publisher.Publish("fuel.entry.created", map[string]any{
		"entry_id":   entry.ID,
		"vehicle_id": entry.VehicleID,
		"user_id":    userID,
		"timestamp":  time.Now().UTC(),
	})
	return entry, nil
}

func (s *service) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]FuelEntry, error) {
	return s.repo.List(ctx, vehicleID, userID)
}
