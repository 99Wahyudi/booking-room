package controller

import (
	"booking-room-be/app/service"
	"booking-room-be/pkg/database"
	"booking-room-be/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	authService *service.AuthService
}

func NewAuthController() *AuthController {
	return &AuthController{
		authService: service.NewAuthService(database.GetDB()),
	}
}

func (ctrl *AuthController) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	token, user, err := ctrl.authService.LoginUser(req.Email, req.Password)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid email or password", nil)
	}

	return response.SuccessResponse(c, fiber.StatusOK, "Login successful", fiber.Map{
		"token":      token,
		"expires_in": "7 days",
		"user": fiber.Map{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"phone": user.Phone,
			"role":  user.Role,
		},
	})
}

func (ctrl *AuthController) Register(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Phone    string `json:"phone"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	user, err := ctrl.authService.RegisterCustomer(req.Name, req.Email, req.Password, req.Phone)
	if err != nil {
		if err == service.ErrEmailTaken {
			return response.ErrorResponse(c, fiber.StatusConflict, "Email already registered", nil)
		}
		return response.ErrorResponse(c, fiber.StatusBadRequest, "name, email, and password are required", nil)
	}

	return response.SuccessResponse(c, fiber.StatusCreated, "Registration successful", fiber.Map{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	})
}

func (ctrl *AuthController) Me(c *fiber.Ctx) error {
	user, err := ctrl.authService.GetUserByID(getUserID(c))
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusNotFound, "User not found", nil)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Current user", fiber.Map{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"phone": user.Phone,
		"role":  user.Role,
	})
}

func (ctrl *AuthController) Logout(c *fiber.Ctx) error {
	return response.SuccessResponse(c, fiber.StatusOK, "Logout successful", nil)
}
