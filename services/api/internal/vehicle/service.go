package vehicle

import (
	"context"
	"time"

	"github.com/google/uuid"
	"vroom-api/internal/events"
)

type Service interface {
	Create(ctx context.Context, in CreateVehicleInput) (*Vehicle, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error)
	List(ctx context.Context, userID *uuid.UUID) ([]Vehicle, error)
	Update(ctx context.Context, id uuid.UUID, in UpdateVehicleInput) (*Vehicle, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo      Repository
	publisher events.Publisher
}

func NewService(r Repository, pub events.Publisher) Service {
	return &service{repo: r, publisher: pub}
}

func (s *service) Create(ctx context.Context, in CreateVehicleInput) (*Vehicle, error) {
	v, err := s.repo.Create(ctx, in)
	if err != nil {
		return nil, err
	}
	s.publisher.Publish("vehicle.created", map[string]any{
		"vehicle_id": v.ID,
		"user_id":    v.UserID,
		"timestamp":  time.Now().UTC(),
	})
	return v, nil
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, userID *uuid.UUID) ([]Vehicle, error) {
	return s.repo.List(ctx, userID)
}

func (s *service) Update(ctx context.Context, id uuid.UUID, in UpdateVehicleInput) (*Vehicle, error) {
	v, err := s.repo.Update(ctx, id, in)
	if err != nil {
		return nil, err
	}
	s.publisher.Publish("vehicle.updated", map[string]any{
		"vehicle_id": v.ID,
		"user_id":    v.UserID,
		"timestamp":  time.Now().UTC(),
	})
	return v, nil
}

func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	s.publisher.Publish("vehicle.deleted", map[string]any{
		"vehicle_id": id,
		"timestamp":  time.Now().UTC(),
	})
	return nil
}
