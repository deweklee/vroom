package export

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"vroom-api/internal/fuel"
	"vroom-api/internal/maintenance"
	"vroom-api/internal/modifications"
	"vroom-api/internal/vehicle"
)

type Handler struct {
	vehicles    vehicle.Service
	fuel        fuel.Service
	maintenance maintenance.Service
	mods        modifications.Service
}

func NewHandler(v vehicle.Service, f fuel.Service, m maintenance.Service, mod modifications.Service) *Handler {
	return &Handler{vehicles: v, fuel: f, maintenance: m, mods: mod}
}

func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	r.GET("/vehicles/:id/export", authMiddleware, h.exportVehicle)
}

func (h *Handler) exportVehicle(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)
	ctx := c.Request.Context()

	v, err := h.vehicles.GetByID(ctx, vehicleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
		return
	}

	fuelEntries, err := h.fuel.List(ctx, vehicleID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	maintenanceRecords, err := h.maintenance.List(ctx, vehicleID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	mods, err := h.mods.List(ctx, vehicleID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	filename := fmt.Sprintf("%s_%s_%d_export.csv", v.Make, v.Model, v.Year)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Content-Type", "text/csv")

	w := csv.NewWriter(c.Writer)

	// --- Vehicle Info ---
	w.Write([]string{"VEHICLE INFO"})
	w.Write([]string{"Make", "Model", "Year", "VIN", "Purchase Price", "Purchase Date", "Current Mileage"})
	w.Write([]string{
		v.Make,
		v.Model,
		fmt.Sprintf("%d", v.Year),
		derefStr(v.VIN),
		formatFloat(v.PurchasePrice),
		formatDate(v.PurchaseDate),
		formatInt(v.CurrentMileage),
	})
	w.Write([]string{})

	// --- Fuel Entries ---
	w.Write([]string{"FUEL ENTRIES"})
	w.Write([]string{"Date", "Odometer", "Gallons", "Price/Gallon", "Total Cost", "Location"})
	for _, fe := range fuelEntries {
		w.Write([]string{
			formatDate(fe.FuelDate),
			fmt.Sprintf("%d", fe.Odometer),
			fmt.Sprintf("%.3f", fe.Gallons),
			fmt.Sprintf("%.3f", fe.PricePerGallon),
			fmt.Sprintf("%.2f", fe.TotalCost),
			derefStr(fe.Location),
		})
	}
	w.Write([]string{})

	// --- Maintenance Records ---
	w.Write([]string{"MAINTENANCE RECORDS"})
	w.Write([]string{"Date", "Service Type", "Odometer", "Cost", "Shop", "Notes"})
	for _, mr := range maintenanceRecords {
		w.Write([]string{
			mr.ServiceDate.Format("2006-01-02"),
			mr.ServiceType,
			formatInt(mr.Odometer),
			formatFloat(mr.Cost),
			derefStr(mr.Shop),
			derefStr(mr.Notes),
		})
	}
	w.Write([]string{})

	// --- Modifications ---
	w.Write([]string{"MODIFICATIONS"})
	w.Write([]string{"Install Date", "Name", "Category", "Cost", "Notes"})
	for _, mod := range mods {
		w.Write([]string{
			formatDate(mod.InstallDate),
			mod.Name,
			derefStr(mod.Category),
			formatFloat(mod.Cost),
			derefStr(mod.Notes),
		})
	}

	w.Flush()
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func formatFloat(f *float64) string {
	if f == nil {
		return ""
	}
	return fmt.Sprintf("%.2f", *f)
}

func formatInt(i *int) string {
	if i == nil {
		return ""
	}
	return fmt.Sprintf("%d", *i)
}

func formatDate(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}
