package modifications

import (
	"time"

	"github.com/google/uuid"
)

type Modification struct {
	ID          uuid.UUID  `json:"id"`
	VehicleID   uuid.UUID  `json:"vehicle_id"`
	Name        string     `json:"name"`
	Category    *string    `json:"category,omitempty"`
	Cost        *float64   `json:"cost,omitempty"`
	InstallDate *time.Time `json:"install_date,omitempty"`
	Notes       *string    `json:"notes,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreateModificationInput struct {
	Name        string     `json:"name" binding:"required"`
	Category    *string    `json:"category"`
	Cost        *float64   `json:"cost"`
	InstallDate *time.Time `json:"install_date"`
	Notes       *string    `json:"notes"`
}
