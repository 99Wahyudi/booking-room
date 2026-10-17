package middleware

import (
	"strings"

	"booking-room-be/pkg/jwt"
	"booking-room-be/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// AuthRequired verifies the JWT from the Authorization header and injects
// user_id (int64) and role into the Fiber context.
func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.ErrorResponse(c, fiber.StatusUnauthorized, "Missing authorization header", nil)
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return response.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid authorization format. Use: Bearer <token>", nil)
		}

		claims, err := jwt.ParseAndValidateJWT(tokenString)
		if err != nil {
			return response.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid or expired token", err.Error())
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}


