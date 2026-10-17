package service

import (
	"time"

	"booking-room-be/app/model"
	"booking-room-be/app/repository"

	"github.com/jmoiron/sqlx"
)

type BookingService struct {
	db       *sqlx.DB
	repo     repository.BookingRepository
	roomRepo repository.RoomRepository
}

func NewBookingService(db *sqlx.DB) *BookingService {
	return &BookingService{
		db:       db,
		repo:     repository.NewBookingRepository(db),
		roomRepo: repository.NewRoomRepository(db),
	}
}

// GenerateNightsList expands the date range into one entry per night
// (check-in inclusive, check-out exclusive).
func GenerateNightsList(checkIn, checkOut time.Time) []time.Time {
	nights := make([]time.Time, 0)
	for d := checkIn; d.Before(checkOut); d = d.AddDate(0, 0, 1) {
		nights = append(nights, d)
	}
	return nights
}

// CalculateTotalPrice computes price_per_night * number of nights.
func CalculateTotalPrice(pricePerNight float64, checkIn, checkOut time.Time) float64 {
	nights := len(GenerateNightsList(checkIn, checkOut))
	return pricePerNight * float64(nights)
}

// CreateBooking validates, prices, and creates a booking atomically.
func (s *BookingService) CreateBooking(userID, roomID int64, checkIn, checkOut time.Time, guests int, notes string) (*model.Booking, error) {
	if !checkOut.After(checkIn) {
		return nil, ErrBadRequest
	}
	if checkIn.Before(time.Now().Truncate(24 * time.Hour)) {
		return nil, ErrBadRequest
	}
	if guests <= 0 {
		guests = 1
	}

	room, err := s.roomRepo.FindByID(roomID)
	if err != nil {
		return nil, ErrNotFound
	}
	if room.Status != "available" {
		return nil, repository.ErrBookingConflict
	}
	if guests > room.Capacity {
		return nil, ErrBadRequest
	}

	booking := &model.Booking{
		RoomID:       room.ID,
		UserID:       userID,
		CheckInDate:  checkIn,
		CheckOutDate: checkOut,
		Guests:       guests,
		Status:       "pending",
		Notes:        notes,
		TotalPrice:   CalculateTotalPrice(room.PricePerNight, checkIn, checkOut),
	}

	if err := s.repo.CreateBooking(booking, GenerateNightsList(checkIn, checkOut)); err != nil {
		return nil, err
	}
	return s.repo.FindByID(booking.ID)
}

func (s *BookingService) GetBookingByID(id int64) (*model.Booking, error) {
	booking, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return booking, nil
}

func (s *BookingService) GetUserBookings(userID int64, status *string, page, limit int) ([]model.Booking, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	return s.repo.FindByUserID(userID, status, page, limit)
}

func (s *BookingService) ListAllBookingsAdmin(filter repository.BookingFilter, page, limit int) ([]model.Booking, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	return s.repo.FindAll(filter, page, limit)
}

// CancelBooking validates ownership (unless admin) and cancellable status.
func (s *BookingService) CancelBooking(bookingID, requestingUserID int64, isAdmin bool, reason string) error {
	booking, err := s.repo.FindByID(bookingID)
	if err != nil {
		return ErrNotFound
	}
	if !isAdmin && booking.UserID != requestingUserID {
		return ErrForbidden
	}
	if booking.Status != "pending" && booking.Status != "confirmed" {
		return ErrInvalidStatus
	}
	if reason != "" {
		_, _ = s.db.Exec(`UPDATE bookings SET notes = CONCAT(IFNULL(notes,''), ?) WHERE id = ?`,
			"\n[Cancelled] "+reason, bookingID)
	}
	return s.repo.CancelBooking(bookingID)
}

// ConfirmBooking transitions pending -> confirmed.
func (s *BookingService) ConfirmBooking(bookingID int64) error {
	booking, err := s.repo.FindByID(bookingID)
	if err != nil {
		return ErrNotFound
	}
	if booking.Status != "pending" {
		return ErrInvalidStatus
	}
	return s.repo.UpdateStatus(bookingID, "confirmed")
}

// RejectBooking transitions pending -> cancelled and frees the nights.
func (s *BookingService) RejectBooking(bookingID int64, reason string) error {
	booking, err := s.repo.FindByID(bookingID)
	if err != nil {
		return ErrNotFound
	}
	if booking.Status != "pending" {
		return ErrInvalidStatus
	}
	if err := s.repo.UpdateStatus(bookingID, "cancelled"); err != nil {
		return err
	}
	if reason != "" {
		_, _ = s.db.Exec(`UPDATE bookings SET notes = CONCAT(IFNULL(notes,''), ?) WHERE id = ?`,
			"\n[Rejected] "+reason, bookingID)
	}
	return s.repo.DeleteBookingNightsByBookingID(bookingID)
}

// CompleteBooking transitions confirmed -> completed (manual or scheduler).
func (s *BookingService) CompleteBooking(bookingID int64) error {
	booking, err := s.repo.FindByID(bookingID)
	if err != nil {
		return ErrNotFound
	}
	if booking.Status != "confirmed" {
		return ErrInvalidStatus
	}
	return s.repo.UpdateStatus(bookingID, "completed")
}

// AutoCompleteExpired marks confirmed bookings whose check-out date has
// passed as completed. Returns the number of rows updated.
func (s *BookingService) AutoCompleteExpired() (int64, error) {
	return s.repo.AutoCompleteExpired()
}
