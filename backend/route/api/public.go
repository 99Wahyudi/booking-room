package api

import (
	"github.com/gofiber/fiber/v2"
)

func Public(app *fiber.App) {
	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "Server is running",
			"data": fiber.Map{
				"status": "ok",
			},
		})
	})
}
