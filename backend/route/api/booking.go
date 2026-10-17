package api

import (
	"booking-room-be/app/http/controller"
	"booking-room-be/app/http/middleware"

	"github.com/gofiber/fiber/v2"
)

// RoomRoutes registers room, room-type and facility endpoints.
func RoomRoutes(app *fiber.App) {
	room := controller.NewRoomController()

	api := app.Group("/api")

	// Public
	api.Get("/rooms", room.Index)
	api.Get("/rooms/search", room.Search)
	api.Get("/rooms/:id", room.Show)
	api.Get("/room-types", room.ListRoomTypes)
	api.Get("/facilities", room.ListFacilities)
}

// BookingRoutes registers booking endpoints (customer).
func BookingRoutes(app *fiber.App) {
	booking := controller.NewBookingController()

	api := app.Group("/api")

	// Customer (protected)
	customer := api.Group("/bookings", middleware.AuthRequired())
	customer.Post("/", booking.Create)
	customer.Get("/my", booking.MyBookings)
	customer.Get("/:id", booking.GetBookingByID)
	customer.Patch("/:id/cancel", booking.Cancel)
}

// AdminRoutes registers admin-only endpoints.
func AdminRoutes(app *fiber.App) {
	admin := controller.NewAdminController()

	api := app.Group("/api/admin", middleware.AuthRequired(), middleware.AdminOnly())

	// Room types
	api.Post("/room-types", admin.CreateRoomType)
	api.Put("/room-types/:id", admin.UpdateRoomType)
	api.Delete("/room-types/:id", admin.DeleteRoomType)

	// Facilities
	api.Post("/facilities", admin.CreateFacility)
	api.Put("/facilities/:id", admin.UpdateFacility)
	api.Delete("/facilities/:id", admin.DeleteFacility)

	// Rooms
	api.Get("/rooms", admin.ListRooms)
	api.Get("/rooms/:id", admin.GetRoom)
	api.Post("/rooms", admin.CreateRoom)
	api.Put("/rooms/:id", admin.UpdateRoom)
	api.Delete("/rooms/:id", admin.SoftDeleteRoom)
	api.Post("/rooms/:id/photos", admin.AddRoomPhotos)
	api.Delete("/rooms/:id/photos/:photo_id", admin.DeleteRoomPhoto)
	api.Patch("/rooms/:id/photos/:photo_id/primary", admin.SetPrimaryPhoto)
	api.Put("/rooms/:id/facilities", admin.SyncRoomFacilities)

	// Bookings
	api.Get("/bookings", admin.ListAllBookings)
	api.Patch("/bookings/:id/confirm", admin.ConfirmBooking)
	api.Patch("/bookings/:id/reject", admin.RejectBooking)
	api.Patch("/bookings/:id/complete", admin.CompleteBooking)

	// Dashboard
	api.Get("/dashboard/stats", admin.GetDashboardStats)
	api.Get("/dashboard/recent-bookings", admin.GetRecentBookings)
}


