package middleware

import (
	"booking-room-be/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// AdminOnly checks the role in the context; non-admin gets 403.
func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, _ := c.Locals("role").(string)
		if role != "admin" {
			return response.ErrorResponse(c, fiber.StatusForbidden, "You don't have permission to access this resource", nil)
		}
		return c.Next()
	}
}

