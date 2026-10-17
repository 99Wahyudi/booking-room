package api

import (
	"booking-room-be/app/http/controller"
	"booking-room-be/app/http/middleware"

	"github.com/gofiber/fiber/v2"
)

func Auth(app *fiber.App) {
	auth := controller.NewAuthController()

	api := app.Group("/api")

	// Public routes
	api.Post("/login", auth.Login)
	api.Post("/register", auth.Register)

	// Protected routes
	protected := api.Group("/auth", middleware.AuthRequired())
	protected.Get("/me", auth.Me)
	protected.Post("/logout", auth.Logout)
}
