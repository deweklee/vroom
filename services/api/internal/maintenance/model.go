package maintenance

import (
	"time"

	"github.com/google/uuid"
)

type Record struct {
	ID          uuid.UUID `json:"id"`
	VehicleID   uuid.UUID `json:"vehicle_id"`
	ServiceType string    `json:"service_type"`
	Odometer    *int      `json:"odometer,omitempty"`
	Cost        *float64  `json:"cost,omitempty"`
	Shop        *string   `json:"shop,omitempty"`
	Notes       *string   `json:"notes,omitempty"`
	ServiceDate time.Time `json:"service_date"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateRecordInput struct {
	ServiceType string    `json:"service_type" binding:"required"`
	Odometer    *int      `json:"odometer"`
	Cost        *float64  `json:"cost"`
	Shop        *string   `json:"shop"`
	Notes       *string   `json:"notes"`
	ServiceDate time.Time `json:"service_date" binding:"required"`
}
