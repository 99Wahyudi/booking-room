package controller

import (
	"time"

	"booking-room-be/app/repository"
	"booking-room-be/app/service"
	"booking-room-be/pkg/database"
	"booking-room-be/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type BookingController struct {
	bookingService *service.BookingService
}

func NewBookingController() *BookingController {
	return &BookingController{
		bookingService: service.NewBookingService(database.GetDB()),
	}
}

// Create makes a new booking for the authenticated user.
// POST /api/bookings  { room_id, check_in_date, check_out_date, guests, notes }
func (ctrl *BookingController) Create(c *fiber.Ctx) error {
	var req struct {
		RoomID       int64  `json:"room_id"`
		CheckInDate  string `json:"check_in_date"`
		CheckOutDate string `json:"check_out_date"`
		Guests       int    `json:"guests"`
		Notes        string `json:"notes"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	checkIn, err1 := time.Parse("2006-01-02", req.CheckInDate)
	checkOut, err2 := time.Parse("2006-01-02", req.CheckOutDate)
	if err1 != nil || err2 != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid date format, use YYYY-MM-DD", nil)
	}

	booking, err := ctrl.bookingService.CreateBooking(getUserID(c), req.RoomID, checkIn, checkOut, req.Guests, req.Notes)
	if err != nil {
		switch err {
		case service.ErrBadRequest:
			return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid booking data (dates, capacity, or past check-in)", nil)
		case repository.ErrBookingConflict:
			return response.ErrorResponse(c, fiber.StatusConflict, "Room is already booked for the selected dates", nil)
		case service.ErrNotFound:
			return response.ErrorResponse(c, fiber.StatusNotFound, "Room not found", nil)
		}
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create booking", err)
	}
	return response.SuccessResponse(c, fiber.StatusCreated, "Booking created", booking)
}

// MyBookings lists bookings of the authenticated user (with pagination & status filter).
// GET /api/bookings/my?status=pending&page=1&limit=10
func (ctrl *BookingController) MyBookings(c *fiber.Ctx) error {
	page, limit := parsePageLimit(c)
	var status *string
	if v := c.Query("status"); v != "" {
		status = &v
	}
	bookings, total, err := ctrl.bookingService.GetUserBookings(getUserID(c), status, page, limit)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch bookings", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "My bookings", fiber.Map{
		"items": bookings,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetBookingByID returns a single booking (owner or admin).
// GET /api/bookings/:id
func (ctrl *BookingController) GetBookingByID(c *fiber.Ctx) error {
	id := parseID(c.Params("id"))
	booking, err := ctrl.bookingService.GetBookingByID(id)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusNotFound, "Booking not found", nil)
	}
	if getUserRole(c) != "admin" && booking.UserID != getUserID(c) {
		return response.ErrorResponse(c, fiber.StatusForbidden, "You can only view your own booking", nil)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Booking detail", booking)
}

// Cancel cancels a booking (owner or admin) and frees its nights.
// PATCH /api/bookings/:id/cancel
func (ctrl *BookingController) Cancel(c *fiber.Ctx) error {
	id := parseID(c.Params("id"))
	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.BodyParser(&req)
	err := ctrl.bookingService.CancelBooking(id, getUserID(c), getUserRole(c) == "admin", req.Reason)
	if err != nil {
		switch err {
		case service.ErrNotFound:
			return response.ErrorResponse(c, fiber.StatusNotFound, "Booking not found", nil)
		case service.ErrForbidden:
			return response.ErrorResponse(c, fiber.StatusForbidden, "You can only cancel your own booking", nil)
		case service.ErrInvalidStatus:
			return response.ErrorResponse(c, fiber.StatusBadRequest, "Booking cannot be cancelled in its current status", nil)
		}
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to cancel booking", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Booking cancelled", nil)
}
