package controller

import (
	"time"

	"booking-room-be/app/repository"
	"booking-room-be/app/service"
	"booking-room-be/pkg/database"
	"booking-room-be/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AdminController struct {
	roomTypeService *service.RoomTypeService
	facilityService *service.FacilityService
	roomService     *service.RoomService
	bookingService  *service.BookingService
	dashboardSvc    *service.DashboardService
}

func NewAdminController() *AdminController {
	db := database.GetDB()
	return &AdminController{
		roomTypeService: service.NewRoomTypeService(db),
		facilityService: service.NewFacilityService(db),
		roomService:     service.NewRoomService(db),
		bookingService:  service.NewBookingService(db),
		dashboardSvc:    service.NewDashboardService(db),
	}
}

// ---------- Room Types ----------

func (ctrl *AdminController) CreateRoomType(c *fiber.Ctx) error {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	rt, err := ctrl.roomTypeService.CreateRoomType(req.Name, req.Description)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Failed to create room type", err)
	}
	return response.SuccessResponse(c, fiber.StatusCreated, "Room type created", rt)
}

func (ctrl *AdminController) UpdateRoomType(c *fiber.Ctx) error {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	if err := ctrl.roomTypeService.UpdateRoomType(parseID(c.Params("id")), req.Name, req.Description); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room type updated", nil)
}

func (ctrl *AdminController) DeleteRoomType(c *fiber.Ctx) error {
	if err := ctrl.roomTypeService.DeleteRoomType(parseID(c.Params("id"))); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room type deleted", nil)
}

// ---------- Facilities ----------

func (ctrl *AdminController) CreateFacility(c *fiber.Ctx) error {
	var req struct {
		Name string `json:"name"`
		Icon string `json:"icon"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	f, err := ctrl.facilityService.CreateFacility(req.Name, req.Icon)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Failed to create facility", err)
	}
	return response.SuccessResponse(c, fiber.StatusCreated, "Facility created", f)
}

func (ctrl *AdminController) UpdateFacility(c *fiber.Ctx) error {
	var req struct {
		Name string `json:"name"`
		Icon string `json:"icon"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	if err := ctrl.facilityService.UpdateFacility(parseID(c.Params("id")), req.Name, req.Icon); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Facility updated", nil)
}

func (ctrl *AdminController) DeleteFacility(c *fiber.Ctx) error {
	if err := ctrl.facilityService.DeleteFacility(parseID(c.Params("id"))); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Facility deleted", nil)
}

// mapServiceError converts service/domain errors into HTTP responses.
func mapServiceError(c *fiber.Ctx, err error) error {
	switch err {
	case service.ErrNotFound:
		return response.ErrorResponse(c, fiber.StatusNotFound, "Resource not found", nil)
	case service.ErrBadRequest:
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request", nil)
	case service.ErrForbidden:
		return response.ErrorResponse(c, fiber.StatusForbidden, "Forbidden", nil)
	case service.ErrRoomInUse:
		return response.ErrorResponse(c, fiber.StatusConflict, "Resource is still referenced by other data", nil)
	case repository.ErrBookingConflict:
		return response.ErrorResponse(c, fiber.StatusConflict, "Room is already booked for the selected dates", nil)
	case service.ErrInvalidStatus:
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid status transition", nil)
	}
	return response.ErrorResponse(c, fiber.StatusInternalServerError, "Operation failed", err)
}


// ---------- Rooms ----------

func (ctrl *AdminController) CreateRoom(c *fiber.Ctx) error {
	var dto service.CreateRoomInput
	if err := c.BodyParser(&dto); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	room, err := ctrl.roomService.CreateRoom(dto)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Failed to create room", err)
	}
	return response.SuccessResponse(c, fiber.StatusCreated, "Room created", room)
}

func (ctrl *AdminController) UpdateRoom(c *fiber.Ctx) error {
	var dto service.UpdateRoomInput
	if err := c.BodyParser(&dto); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	if err := ctrl.roomService.UpdateRoom(parseID(c.Params("id")), dto); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room updated", nil)
}

func (ctrl *AdminController) SoftDeleteRoom(c *fiber.Ctx) error {
	if err := ctrl.roomService.SoftDeleteRoom(parseID(c.Params("id"))); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room deleted", nil)
}

// ListRooms (admin, paginated + filter).
// GET /api/admin/rooms?status=&room_type_id=&min_capacity=&page=1&limit=10
func (ctrl *AdminController) ListRooms(c *fiber.Ctx) error {
	page, limit := parsePageLimit(c)
	filter := repository.RoomFilter{
		Status:      c.Query("status"),
		RoomTypeID:  parseID(c.Query("room_type_id")),
		MinCapacity: int(parseID(c.Query("min_capacity"))),
		Search:      c.Query("search"),
		Sort:        c.Query("sort"),
	}
	rooms, total, err := ctrl.roomService.ListRoomsAdmin(filter, page, limit)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch rooms", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Rooms", fiber.Map{
		"items": rooms, "total": total, "page": page, "limit": limit,
	})
}

// GetRoom (admin) returns a single room with room_type + photos + facilities.
// GET /api/admin/rooms/:id
func (ctrl *AdminController) GetRoom(c *fiber.Ctx) error {
	room, err := ctrl.roomService.GetRoomDetail(parseID(c.Params("id")))
	if err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Room", room)
}

// ---------- Room Photos ----------

// AddRoomPhotos accepts either multipart/form-data files on field "photos"
// (saved to storage/uploads) or a JSON body { "urls": [...] } (back-compat).
// POST /api/admin/rooms/:id/photos
func (ctrl *AdminController) AddRoomPhotos(c *fiber.Ctx) error {
	roomID := parseID(c.Params("id"))
	if roomID <= 0 {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid room id", nil)
	}

	// Multipart upload
	form, err := c.MultipartForm()
	if err == nil && form != nil {
		headers := form.File["photos"]
		if len(headers) > 0 {
			urls, err := saveUploadedFiles(headers)
			if err != nil {
				return response.ErrorResponse(c, fiber.StatusBadRequest, err.Error(), err)
			}
			photos, err := ctrl.roomService.AddRoomPhotos(roomID, urls)
			if err != nil {
				return mapServiceError(c, err)
			}
			return response.SuccessResponse(c, fiber.StatusCreated, "Photos added", photos)
		}
	}

	// Back-compat: JSON body { "urls": [...] }
	var req struct {
		URLs []string `json:"urls"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	photos, err := ctrl.roomService.AddRoomPhotos(roomID, req.URLs)
	if err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusCreated, "Photos added", photos)
}

func (ctrl *AdminController) DeleteRoomPhoto(c *fiber.Ctx) error {
	if err := ctrl.roomService.DeleteRoomPhoto(parseID(c.Params("photo_id"))); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Photo deleted", nil)
}

func (ctrl *AdminController) SetPrimaryPhoto(c *fiber.Ctx) error {
	roomID := parseID(c.Params("id"))
	photoID := parseID(c.Params("photo_id"))
	if err := ctrl.roomService.SetPrimaryPhoto(roomID, photoID); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Primary photo set", nil)
}

// ---------- Room Facilities ----------

func (ctrl *AdminController) SyncRoomFacilities(c *fiber.Ctx) error {
	var req struct {
		FacilityIDs []int64 `json:"facility_ids"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}
	if err := ctrl.roomService.SyncRoomFacilities(parseID(c.Params("id")), req.FacilityIDs); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Facilities synced", nil)
}


// ---------- Bookings (admin) ----------

// ListAllBookings (admin, paginated + filter).
// GET /api/admin/bookings?status=&date_from=&date_to=&guest_name=&page=1&limit=10
func (ctrl *AdminController) ListAllBookings(c *fiber.Ctx) error {
	page, limit := parsePageLimit(c)
	filter := repository.BookingFilter{
		Status:    c.Query("status"),
		GuestName: c.Query("guest_name"),
	}
	if v := c.Query("date_from"); v != "" {
		if d, err := time.Parse("2006-01-02", v); err == nil {
			filter.DateFrom = &d
		}
	}
	if v := c.Query("date_to"); v != "" {
		if d, err := time.Parse("2006-01-02", v); err == nil {
			filter.DateTo = &d
		}
	}
	bookings, total, err := ctrl.bookingService.ListAllBookingsAdmin(filter, page, limit)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch bookings", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "All bookings", fiber.Map{
		"items": bookings, "total": total, "page": page, "limit": limit,
	})
}

func (ctrl *AdminController) ConfirmBooking(c *fiber.Ctx) error {
	if err := ctrl.bookingService.ConfirmBooking(parseID(c.Params("id"))); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Booking confirmed", nil)
}

func (ctrl *AdminController) RejectBooking(c *fiber.Ctx) error {
	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.BodyParser(&req) // reason is optional
	if err := ctrl.bookingService.RejectBooking(parseID(c.Params("id")), req.Reason); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Booking rejected", nil)
}

func (ctrl *AdminController) CompleteBooking(c *fiber.Ctx) error {
	if err := ctrl.bookingService.CompleteBooking(parseID(c.Params("id"))); err != nil {
		return mapServiceError(c, err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Booking completed", nil)
}

// ---------- Dashboard ----------

func (ctrl *AdminController) GetDashboardStats(c *fiber.Ctx) error {
	stats, err := ctrl.dashboardSvc.GetDashboardStats()
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch dashboard stats", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Dashboard stats", stats)
}

func (ctrl *AdminController) GetRecentBookings(c *fiber.Ctx) error {
	limit, _ := strconvAtoi(c.Query("limit", "5"))
	bookings, err := ctrl.dashboardSvc.GetRecentBookings(limit)
	if err != nil {
		return response.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch recent bookings", err)
	}
	return response.SuccessResponse(c, fiber.StatusOK, "Recent bookings", bookings)
}
