package api

import (
	"github.com/gofiber/fiber/v2"
)

func NotFoundRoute(a *fiber.App) {
	a.Use(
		func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "sorry, endpoint is not found",
			})
		},
	)
}
