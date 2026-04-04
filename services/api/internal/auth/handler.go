package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type Handler struct {
	svc Service
}

func NewHandler(s Service) *Handler {
	return &Handler{svc: s}
}

func googleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"openid", "email"},
		Endpoint:     google.Endpoint,
	}
}

func randomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	g := r.Group("/auth")
	{
		g.POST("/register", h.register)
		g.POST("/login", h.login)
		g.GET("/google", h.googleRedirect)
		g.GET("/google/callback", h.googleCallback)
	}
}

func (h *Handler) googleRedirect(c *gin.Context) {
	state := randomState()
	c.SetCookie("oauth_state", state, 300, "/", "", false, true)
	url := googleOAuthConfig().AuthCodeURL(state, oauth2.AccessTypeOnline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *Handler) googleCallback(c *gin.Context) {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	cookie, err := c.Cookie("oauth_state")
	if err != nil || cookie != c.Query("state") {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=invalid_state")
		return
	}
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	cfg := googleOAuthConfig()
	oauthToken, err := cfg.Exchange(context.Background(), c.Query("code"))
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=oauth_exchange")
		return
	}

	resp, err := cfg.Client(context.Background(), oauthToken).Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=userinfo")
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var info struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &info); err != nil || info.ID == "" {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=userinfo_parse")
		return
	}

	u, err := h.svc.LoginWithGoogle(c.Request.Context(), info.ID, info.Email)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=login")
		return
	}

	secret := os.Getenv("JWT_SECRET")
	jwtToken, err := GenerateToken(secret, u, 24*time.Hour)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=token")
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/login?token=%s", frontendURL, jwtToken))
}

func (h *Handler) register(c *gin.Context) {
	var in RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.svc.Register(c.Request.Context(), in.Email, in.Password)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "JWT_SECRET is not configured"})
		return
	}

	token, err := GenerateToken(secret, u, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"access_token": token,
		"user": gin.H{
			"id":    u.ID,
			"email": u.Email,
		},
	})
}

func (h *Handler) login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.svc.Login(c.Request.Context(), in.Email, in.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "JWT_SECRET is not configured"})
		return
	}

	token, err := GenerateToken(secret, u, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"user": gin.H{
			"id":    u.ID,
			"email": u.Email,
		},
	})
}

