package service

import (
	"time"

	"booking-room-be/app/model"
	"booking-room-be/app/repository"

	"github.com/jmoiron/sqlx"
)

type DashboardService struct {
	db           *sqlx.DB
	roomRepo     repository.RoomRepository
	bookingRepo  repository.BookingRepository
}

func NewDashboardService(db *sqlx.DB) *DashboardService {
	return &DashboardService{
		db:          db,
		roomRepo:    repository.NewRoomRepository(db),
		bookingRepo: repository.NewBookingRepository(db),
	}
}

// DashboardStats aggregates admin dashboard numbers.
type DashboardStats struct {
	TotalRooms         int64 `json:"total_rooms"`
	AvailableToday     int64 `json:"available_today"`
	PendingBookings    int64 `json:"pending_bookings"`
	BookingsThisMonth  int64 `json:"bookings_this_month"`
}

// GetDashboardStats returns total rooms, rooms available today, pending
// bookings, and bookings created in the current month.
func (s *DashboardService) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}
	today := time.Now().Format("2006-01-02")
	monthStart := time.Now().Format("2006-01") + "-01"

	if err := s.db.Get(&stats.TotalRooms, `SELECT COUNT(*) FROM rooms WHERE deleted_at IS NULL`); err != nil {
		return nil, err
	}
	if err := s.db.Get(&stats.AvailableToday, `SELECT COUNT(*) FROM rooms r
		WHERE r.deleted_at IS NULL AND r.status = 'available'
		AND NOT EXISTS (
			SELECT 1 FROM booking_nights bn
			JOIN bookings b ON b.id = bn.booking_id
			WHERE bn.room_id = r.id AND b.status IN ('pending','confirmed')
			AND bn.stay_date = ?)`, today); err != nil {
		return nil, err
	}
	if err := s.db.Get(&stats.PendingBookings, `SELECT COUNT(*) FROM bookings WHERE status = 'pending'`); err != nil {
		return nil, err
	}
	if err := s.db.Get(&stats.BookingsThisMonth, `SELECT COUNT(*) FROM bookings WHERE created_at >= ?`, monthStart); err != nil {
		return nil, err
	}
	return stats, nil
}

// GetRecentBookings returns the latest bookings (limit).
func (s *DashboardService) GetRecentBookings(limit int) ([]model.Booking, error) {
	if limit <= 0 {
		limit = 5
	}
	bookings, _, err := s.bookingRepo.FindAll(repository.BookingFilter{}, 1, limit)
	return bookings, err
}
