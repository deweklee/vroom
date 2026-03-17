package maintenance

import (
	"context"
	"time"

	"github.com/google/uuid"
	"vroom-api/internal/events"
)

type Service interface {
	Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error)
	List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Record, error)
	Update(ctx context.Context, recordID, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error)
	Delete(ctx context.Context, recordID, vehicleID, userID uuid.UUID) error
}

type service struct {
	repo      Repository
	publisher events.Publisher
}

func NewService(r Repository, pub events.Publisher) Service {
	return &service{repo: r, publisher: pub}
}

func (s *service) Create(ctx context.Context, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error) {
	rec, err := s.repo.Create(ctx, vehicleID, userID, in)
	if err != nil {
		return nil, err
	}
	s.publisher.Publish("maintenance.record.created", map[string]any{
		"record_id":  rec.ID,
		"vehicle_id": rec.VehicleID,
		"user_id":    userID,
		"timestamp":  time.Now().UTC(),
	})
	return rec, nil
}

func (s *service) List(ctx context.Context, vehicleID, userID uuid.UUID) ([]Record, error) {
	return s.repo.List(ctx, vehicleID, userID)
}

func (s *service) Update(ctx context.Context, recordID, vehicleID, userID uuid.UUID, in CreateRecordInput) (*Record, error) {
	return s.repo.Update(ctx, recordID, vehicleID, userID, in)
}

func (s *service) Delete(ctx context.Context, recordID, vehicleID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, recordID, vehicleID, userID)
}
