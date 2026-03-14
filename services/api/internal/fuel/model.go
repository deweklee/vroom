package fuel

import (
	"time"

	"github.com/google/uuid"
)

type FuelEntry struct {
	ID             uuid.UUID  `json:"id"`
	VehicleID      uuid.UUID  `json:"vehicle_id"`
	FuelDate       *time.Time `json:"fuel_date,omitempty"`
	Odometer       int        `json:"odometer"`
	Gallons        float64    `json:"gallons"`
	PricePerGallon float64    `json:"price_per_gallon"`
	TotalCost      float64    `json:"total_cost"`
	Location       *string    `json:"location,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CreateFuelEntryInput struct {
	FuelDate       *time.Time `json:"fuel_date"`
	Odometer       int        `json:"odometer" binding:"required"`
	Gallons        float64    `json:"gallons" binding:"required,gt=0"`
	PricePerGallon float64    `json:"price_per_gallon" binding:"required,gt=0"`
	TotalCost      float64    `json:"total_cost" binding:"required,gt=0"`
	Location       *string    `json:"location"`
}
