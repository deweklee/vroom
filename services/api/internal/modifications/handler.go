package modifications

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
	v := r.Group("/vehicles/:id/mods")
	v.Use(authMiddleware)
	{
		v.POST("", h.create)
		v.GET("", h.list)
		v.PUT("/:modID", h.update)
		v.DELETE("/:modID", h.delete)
	}
}

func (h *Handler) create(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	var in CreateModificationInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mod, err := h.svc.Create(c.Request.Context(), vehicleID, userID, in)
	if err != nil {
		if err == ErrVehicleNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, mod)
}

func (h *Handler) update(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	modID, err := uuid.Parse(c.Param("modID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid mod id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	var in CreateModificationInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mod, err := h.svc.Update(c.Request.Context(), modID, vehicleID, userID, in)
	if err != nil {
		if err == ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "modification not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

func (h *Handler) delete(c *gin.Context) {
	vehicleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}
	modID, err := uuid.Parse(c.Param("modID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid mod id"})
		return
	}
	userID := c.MustGet("user_id").(uuid.UUID)

	if err := h.svc.Delete(c.Request.Context(), modID, vehicleID, userID); err != nil {
		if err == ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "modification not found"})
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

	mods, err := h.svc.List(c.Request.Context(), vehicleID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, mods)
}
