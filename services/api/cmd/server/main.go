package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"vroom-api/internal/db"
	"vroom-api/internal/vehicle"
)

func main() {
	port := getEnv("PORT", "8080")

	// Initialize DB pool
	pool := db.NewPoolFromEnv()
	defer pool.Close()

	vehicleRepo := vehicle.NewRepository(pool)
	vehicleSvc := vehicle.NewService(vehicleRepo)
	vehicleHandler := vehicle.NewHandler(vehicleSvc)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// CORS for frontend (Next.js dev server)
	r.Use(corsMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Vehicle routes
	vehicleHandler.RegisterRoutes(r)

	if err := r.Run(":" + port); err != nil {
		os.Exit(1)
	}
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		// Allow localhost for dev; in production you'd restrict to your frontend origin
		allowed := origin == "" || origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000"
		if allowed && origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
