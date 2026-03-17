package fuel

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	svc Service
}

func NewHandler(s Service) *Handler {
	return &Handler{svc: s}
}

func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	v := r.Group("/vehicles/:id/fuel")
	v.Use(authMiddleware)
	{
		v.POST("", h.create)
		v.GET("", h.list)
		v.PUT("/:entryID", h.update)
		v.DELETE("/:entryID", h.delete)
	}
}

func (h *Handler) create(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	var in CreateFuelEntryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.svc.Create(c.Request.Context(), vehicleID, userID, in)
	if err != nil {
		if err == ErrVehicleNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func (h *Handler) update(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	entryID, err := uuid.Parse(c.Param("entryID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	var in CreateFuelEntryInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.svc.Update(c.Request.Context(), entryID, vehicleID, userID, in)
	if err != nil {
		if err == ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "entry not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entry)
}

func (h *Handler) delete(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	entryID, err := uuid.Parse(c.Param("entryID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	if err := h.svc.Delete(c.Request.Context(), entryID, vehicleID, userID); err != nil {
		if err == ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "entry not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) list(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	entries, err := h.svc.List(c.Request.Context(), vehicleID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entries)
}
