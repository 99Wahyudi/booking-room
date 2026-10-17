package repository

import (
	"errors"
	"fmt"
	"time"

	"booking-room-be/app/model"

	"github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

type BookingRepository interface {
	FindByID(id int64) (*model.Booking, error)
	FindByUserID(userID int64, status *string, page, limit int) ([]model.Booking, int, error)
	FindAll(filter BookingFilter, page, limit int) ([]model.Booking, int, error)
	CreateBooking(booking *model.Booking, nights []time.Time) error
	CountActiveByRoom(roomID int64) (int, error)
	CancelBooking(bookingID int64) error
	UpdateStatus(id int64, status string) error
	AutoCompleteExpired() (int64, error)
	DeleteBookingNightsByBookingID(bookingID int64) error
}

// BookingFilter untuk admin: status, rentang tanggal, nama tamu.
type BookingFilter struct {
	Status    string
	DateFrom  *time.Time
	DateTo    *time.Time
	GuestName string
}

// ErrBookingConflict dipakai service untuk memetakan ke HTTP 409.
var ErrBookingConflict = errors.New("room is already booked for the selected dates")

type bookingRepository struct {
	db       *sqlx.DB
	roomRepo RoomRepository
	userRepo UserRepository
}

func NewBookingRepository(db *sqlx.DB) BookingRepository {
	return &bookingRepository{
		db:       db,
		roomRepo: NewRoomRepository(db),
		userRepo: NewUserRepository(db),
	}
}

const bookingSelect = `SELECT b.* FROM bookings b`

// attachRoom loads the related room (with type, photos & facilities) into the booking struct.
func (r *bookingRepository) attachRoom(booking *model.Booking) {
	if room, err := r.roomRepo.FindByID(booking.RoomID); err == nil {
		room.RoomType, _ = r.roomRepo.GetRoomType(room.RoomTypeID)
		room.Photos, _ = r.roomRepo.GetPhotos(room.ID)
		room.Facilities, _ = r.roomRepo.GetFacilities(room.ID)
		booking.Room = room
	}
}

// attachUser loads the related guest into the booking struct.
func (r *bookingRepository) attachUser(booking *model.Booking) {
	if user, err := r.userRepo.GetByID(booking.UserID); err == nil {
		booking.User = user
	}
}


func (r *bookingRepository) FindByID(id int64) (*model.Booking, error) {
	var booking model.Booking
	query := bookingSelect + ` WHERE b.id = ?`
	if err := r.db.Get(&booking, query, id); err != nil {
		return nil, err
	}
	r.attachRoom(&booking)
	return &booking, nil
}

func (r *bookingRepository) FindByUserID(userID int64, status *string, page, limit int) ([]model.Booking, int, error) {
	where := ` WHERE b.user_id = ?`
	args := []interface{}{userID}
	if status != nil && *status != "" {
		where += ` AND b.status = ?`
		args = append(args, *status)
	}

	var total int
	if err := r.db.Get(&total, `SELECT COUNT(*) FROM bookings b`+where, args...); err != nil {
		return nil, 0, err
	}

	var bookings []model.Booking
	query := bookingSelect + where + ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
	args = append(args, limit, (page-1)*limit)
	if err := r.db.Select(&bookings, query, args...); err != nil {
		return nil, 0, err
	}
	for i := range bookings {
		r.attachRoom(&bookings[i])
	}
	return bookings, total, nil
}

func (r *bookingRepository) FindAll(filter BookingFilter, page, limit int) ([]model.Booking, int, error) {
	where := ` WHERE 1=1`
	args := []interface{}{}
	if filter.Status != "" {
		where += ` AND b.status = ?`
		args = append(args, filter.Status)
	}
	if filter.DateFrom != nil {
		where += ` AND b.check_out_date > ?`
		args = append(args, filter.DateFrom.Format("2006-01-02"))
	}
	if filter.DateTo != nil {
		where += ` AND b.check_in_date < ?`
		args = append(args, filter.DateTo.Format("2006-01-02"))
	}
	if filter.GuestName != "" {
		where += ` AND u.name LIKE ?`
		args = append(args, "%"+filter.GuestName+"%")
	}

	var total int
	if err := r.db.Get(&total,
		`SELECT COUNT(*) FROM bookings b JOIN users u ON u.id = b.user_id`+where, args...); err != nil {
		return nil, 0, err
	}

	var bookings []model.Booking
	query := bookingSelect + ` JOIN users u ON u.id = b.user_id` + where +
		` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
	args = append(args, limit, (page-1)*limit)
	if err := r.db.Select(&bookings, query, args...); err != nil {
		return nil, 0, err
	}
	for i := range bookings {
		r.attachRoom(&bookings[i])
		r.attachUser(&bookings[i])
	}
	return bookings, total, nil
}

// CreateBooking runs in one transaction:
//  1. SELECT ... FOR UPDATE on the room row (serializes concurrent bookings)
//  2. overlap check on bookings (pending/confirmed)
//  3. insert booking, take LAST_INSERT_ID
//  4. expand nights into booking_nights; duplicate key (1062) -> rollback & conflict
//  5. commit
func (r *bookingRepository) CreateBooking(booking *model.Booking, nights []time.Time) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Lock the room row
	var roomID int64
	if err := tx.Get(&roomID, `SELECT id FROM rooms WHERE id = ? AND deleted_at IS NULL FOR UPDATE`, booking.RoomID); err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	// 2. Overlap check
	var overlap int
	if err := tx.Get(&overlap, `SELECT COUNT(*) FROM bookings
		WHERE room_id = ? AND status IN ('pending','confirmed')
		AND check_in_date < ? AND check_out_date > ?`,
		booking.RoomID, booking.CheckOutDate.Format("2006-01-02"), booking.CheckInDate.Format("2006-01-02")); err != nil {
		return err
	}
	if overlap > 0 {
		return ErrBookingConflict
	}

	// 3. Insert booking
	query := `INSERT INTO bookings (room_id, user_id, check_in_date, check_out_date, guests, status, notes, total_price)
		VALUES (:room_id, :user_id, :check_in_date, :check_out_date, :guests, :status, :notes, :total_price)`
	res, err := tx.NamedExec(query, booking)
	if err != nil {
		return err
	}
	booking.ID, err = res.LastInsertId()
	if err != nil {
		return err
	}

	// 4. Expand nights; 1062 -> conflict (last safety net for race conditions)
	nightQuery := `INSERT INTO booking_nights (booking_id, room_id, stay_date) VALUES (?, ?, ?)`
	for _, night := range nights {
		if _, err := tx.Exec(nightQuery, booking.ID, booking.RoomID, night.Format("2006-01-02")); err != nil {
			var mysqlErr *mysql.MySQLError
			if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
				return ErrBookingConflict
			}
			return err
		}
	}

	return tx.Commit()
}

func (r *bookingRepository) CountActiveByRoom(roomID int64) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM bookings WHERE room_id = ? AND status IN ('pending','confirmed')`
	err := r.db.Get(&count, query, roomID)
	return count, err
}

// CancelBooking marks the booking as cancelled and frees its nights.
func (r *bookingRepository) CancelBooking(bookingID int64) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, bookingID); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM booking_nights WHERE booking_id = ?`, bookingID); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *bookingRepository) UpdateStatus(id int64, status string) error {
	query := `UPDATE bookings SET status = ? WHERE id = ?`
	_, err := r.db.Exec(query, status, id)
	return err
}

// AutoCompleteExpired transitions confirmed bookings whose check-out date
// has passed into completed. Returns the number of rows updated.
func (r *bookingRepository) AutoCompleteExpired() (int64, error) {
	result, err := r.db.Exec(`UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE status = 'confirmed' AND check_out_date < CURDATE()`)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// Cancel marks the booking as cancelled and frees its nights.
func (r *bookingRepository) DeleteBookingNightsByBookingID(bookingID int64) error {
	_, err := r.db.Exec(`DELETE FROM booking_nights WHERE booking_id = ?`, bookingID)
	return err
}
