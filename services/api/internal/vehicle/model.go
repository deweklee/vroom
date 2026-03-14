package vehicle

import (
	"time"

	"github.com/google/uuid"
)

type Vehicle struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"user_id"`
	Make           string     `json:"make"`
	Model          string     `json:"model"`
	Year           int        `json:"year"`
	VIN            *string    `json:"vin,omitempty"`
	PurchasePrice  *float64   `json:"purchase_price,omitempty"`
	PurchaseDate   *time.Time `json:"purchase_date,omitempty"`
	CurrentMileage *int       `json:"current_mileage,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CreateVehicleInput struct {
	UserID         uuid.UUID  `json:"-"` // set from JWT, never from request body
	Make           string     `json:"make" binding:"required"`
	Model          string     `json:"model" binding:"required"`
	Year           int        `json:"year" binding:"required"`
	VIN            *string    `json:"vin"`
	PurchasePrice  *float64   `json:"purchase_price"`
	PurchaseDate   *time.Time `json:"purchase_date"`
	CurrentMileage *int       `json:"current_mileage"`
}

type UpdateVehicleInput struct {
	Make           *string    `json:"make"`
	Model          *string    `json:"model"`
	Year           *int       `json:"year"`
	VIN            *string    `json:"vin"`
	PurchasePrice  *float64   `json:"purchase_price"`
	PurchaseDate   *time.Time `json:"purchase_date"`
	CurrentMileage *int       `json:"current_mileage"`
}
