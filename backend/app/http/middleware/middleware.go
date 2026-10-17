package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func FiberMiddleware(app *fiber.App) {
	// Global Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:  "*",
		AllowMethods:  "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:  "Origin,Content-Type,Accept,Authorization,X-Requested-With",
		ExposeHeaders: "Content-Length",
		MaxAge:        3600,
	}))
}
