package controller

import (
	"strings"
	"time"

	"booking-room-be/app/repository"
	"booking-room-be/app/service"
	"booking-room-be/pkg/database"
	"booking-room-be/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type RoomController struct {
	roomService     *service.RoomService
	roomTypeService *service.RoomTypeService
	facilityService *service.FacilityService
}

func NewRoomController() *RoomController {
	db := database.GetDB()
	return &RoomController{
		roomService:     service.NewRoomService(db),
		roomTypeService: service.NewRoomTypeService(db),
		facilityService: service.NewFacilityService(db),
	}
}

// Index lists rooms (public, simple filters, no pagination).
// GET /api/rooms?status=available&room_type_id=1&min_capacity=2
func (ctrl *RoomController) Index(c *fiber.Ctx) error {
	rooms, _, err := ctrl.roomService.ListRoomsAdmin(repository.RoomFilter{
		Status:      c.Query("status"),
		RoomTypeID:  parseID(c.Query("room_type_id")),
		MinCapacity: int(parseID(c.Query("min_capacity"))),
	}, 1, 100)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch rooms", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Rooms", rooms)
}

// Search is the core availability search with pagination.
// GET /api/rooms/search?check_in=2026-10-01&check_out=2026-10-03&guests=2&room_type_id=1&min_price=100000&max_price=1000000&facilities=1,3&sort=price_low&page=1&limit=10
func (ctrl *RoomController) Search(c *fiber.Ctx) error {
	checkIn, err1 := time.Parse("2006-01-02", c.Query("check_in"))
	checkOut, err2 := time.Parse("2006-01-02", c.Query("check_out"))
	if err1 != nil || err2 != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid date format, use YYYY-MM-DD", nil)
	}
	if !checkOut.After(checkIn) {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "check_out must be after check_in", nil)
	}

	guests, _ := strconvAtoi(c.Query("guests", "1"))

	var roomTypeID *int64
	if v := c.Query("room_type_id"); v != "" {
		id := parseID(v)
		roomTypeID = &id
	}
	var minPrice, maxPrice *float64
	if v := c.Query("min_price"); v != "" {
		if f, err := strconvParseFloat(v); err == nil {
			minPrice = &f
		}
	}
	if v := c.Query("max_price"); v != "" {
		if f, err := strconvParseFloat(v); err == nil {
			maxPrice = &f
		}
	}
	var facilityIDs []int64
	facilitiesParam := c.Query("facilities")
	if facilitiesParam == "" {
		facilitiesParam = c.Query("facility_ids")
	}
	for _, part := range strings.Split(facilitiesParam, ",") {
		if part = strings.TrimSpace(part); part != "" {
			facilityIDs = append(facilityIDs, parseID(part))
		}
	}

	sort := c.Query("sort", "")

	page, limit := parsePageLimit(c)
	rooms, total, err := ctrl.roomService.SearchAvailableRooms(
		checkIn, checkOut, guests, roomTypeID, minPrice, maxPrice, facilityIDs, sort, page, limit)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to search rooms", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Available rooms", fiber.Map{
		"items": rooms,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// Show returns room detail (photos + facilities + room type).
// GET /api/rooms/:id
func (ctrl *RoomController) Show(c *fiber.Ctx) error {
	room, err := ctrl.roomService.GetRoomDetail(parseID(c.Params("id")))
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusNotFound, "Room not found", nil)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room detail", room)
}

func (ctrl *RoomController) ListRoomTypes(c *fiber.Ctx) error {
	types, err := ctrl.roomTypeService.GetAllRoomTypes()
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch room types", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room types", types)
}

func (ctrl *RoomController) ListFacilities(c *fiber.Ctx) error {
	facilities, err := ctrl.facilityService.GetAllFacilities()
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch facilities", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Facilities", facilities)
}
