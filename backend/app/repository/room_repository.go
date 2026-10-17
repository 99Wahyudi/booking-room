package repository

import (
	"fmt"
	"strings"
	"time"

	"booking-room-be/app/model"

	"github.com/jmoiron/sqlx"
)

type RoomRepository interface {
	FindAll(filter RoomFilter) ([]model.Room, error)
	FindByID(id int64) (*model.Room, error)
	GetPhotos(roomID int64) ([]model.RoomPhoto, error)
	GetFacilities(roomID int64) ([]model.Facility, error)
	GetRoomType(roomTypeID int64) (*model.RoomType, error)
	IsRoomAvailable(roomID int64, checkIn, checkOut time.Time) (bool, error)

	// Admin
	CreateRoom(room *model.Room, facilityIDs []int64) error
	UpdateRoom(room *model.Room) error
	SoftDeleteRoom(id int64) error
	ListRoomsAdmin(filter RoomFilter, page, limit int) ([]model.Room, int, error)
	CountActiveBookings(roomID int64) (int, error)
	AddRoomPhotos(roomID int64, urls []string) ([]model.RoomPhoto, error)
	DeleteRoomPhoto(photoID int64) error
	SetPrimaryPhoto(roomID, photoID int64) error
	SyncRoomFacilities(roomID int64, facilityIDs []int64) error
	SearchAvailableRooms(checkIn, checkOut time.Time, guests int, roomTypeID *int64, minPrice, maxPrice *float64, facilityIDs []int64, sort string, page, limit int) ([]model.Room, int, error)
}

type RoomFilter struct {
	Status      string
	RoomTypeID  int64
	MinCapacity int
	MinPrice    *float64
	MaxPrice    *float64
	Search      string
	Sort        string
}

type roomRepository struct {
	db *sqlx.DB
}

func NewRoomRepository(db *sqlx.DB) RoomRepository {
	return &roomRepository{db: db}
}

func (r *roomRepository) FindAll(filter RoomFilter) ([]model.Room, error) {
	var rooms []model.Room
	query := `SELECT r.* FROM rooms r WHERE r.deleted_at IS NULL`
	args := []interface{}{}

	if filter.Status != "" {
		query += ` AND r.status = ?`
		args = append(args, filter.Status)
	}
	if filter.RoomTypeID > 0 {
		query += ` AND r.room_type_id = ?`
		args = append(args, filter.RoomTypeID)
	}
	if filter.MinCapacity > 0 {
		query += ` AND r.capacity >= ?`
		args = append(args, filter.MinCapacity)
	}
	query += ` ORDER BY r.name`

	if err := r.db.Select(&rooms, query, args...); err != nil {
		return nil, err
	}
	return rooms, nil
}

func (r *roomRepository) FindByID(id int64) (*model.Room, error) {
	var room model.Room
	query := `SELECT * FROM rooms WHERE id = ? AND deleted_at IS NULL`
	if err := r.db.Get(&room, query, id); err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *roomRepository) GetPhotos(roomID int64) ([]model.RoomPhoto, error) {
	var photos []model.RoomPhoto
	query := `SELECT * FROM room_photos WHERE room_id = ? ORDER BY sort_order`
	err := r.db.Select(&photos, query, roomID)
	return photos, err
}

func (r *roomRepository) GetFacilities(roomID int64) ([]model.Facility, error) {
	var facilities []model.Facility
	query := `SELECT f.* FROM facilities f
		JOIN room_facilities rf ON rf.facility_id = f.id
		WHERE rf.room_id = ?`
	err := r.db.Select(&facilities, query, roomID)
	return facilities, err
}

func (r *roomRepository) GetRoomType(roomTypeID int64) (*model.RoomType, error) {
	var roomType model.RoomType
	query := `SELECT * FROM room_types WHERE id = ?`
	if err := r.db.Get(&roomType, query, roomTypeID); err != nil {
		return nil, err
	}
	return &roomType, nil
}

// IsRoomAvailable checks that no active booking night overlaps [checkIn, checkOut)
// for the given room. Overlap semantics: stay_date >= check_in AND stay_date < check_out.
func (r *roomRepository) IsRoomAvailable(roomID int64, checkIn, checkOut time.Time) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM booking_nights bn
		JOIN bookings b ON b.id = bn.booking_id
		WHERE bn.room_id = ? AND b.status IN ('pending','confirmed')
		AND bn.stay_date >= ? AND bn.stay_date < ?`
	if err := r.db.Get(&count, query, roomID, checkIn.Format("2006-01-02"), checkOut.Format("2006-01-02")); err != nil {
		return false, err
	}
	return count == 0, nil
}

func (r *roomRepository) CreateRoom(room *model.Room, facilityIDs []int64) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `INSERT INTO rooms (room_type_id, name, price_per_night, capacity, status, description)
		VALUES (:room_type_id, :name, :price_per_night, :capacity, :status, :description)`
	res, err := tx.NamedExec(query, room)
	if err != nil {
		return err
	}
	room.ID, err = res.LastInsertId()
	if err != nil {
		return err
	}

	if err := syncFacilitiesTx(tx, room.ID, facilityIDs); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *roomRepository) UpdateRoom(room *model.Room) error {
	query := `UPDATE rooms SET room_type_id = :room_type_id, name = :name, price_per_night = :price_per_night,
		capacity = :capacity, status = :status, description = :description
		WHERE id = :id AND deleted_at IS NULL`
	_, err := r.db.NamedExec(query, room)
	return err
}

func (r *roomRepository) SoftDeleteRoom(id int64) error {
	query := `UPDATE rooms SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *roomRepository) ListRoomsAdmin(filter RoomFilter, page, limit int) ([]model.Room, int, error) {
	where := ` WHERE r.deleted_at IS NULL`
	args := []interface{}{}
	if filter.Status != "" {
		where += ` AND r.status = ?`
		args = append(args, filter.Status)
	}
	if filter.RoomTypeID > 0 {
		where += ` AND r.room_type_id = ?`
		args = append(args, filter.RoomTypeID)
	}
	if filter.MinCapacity > 0 {
		where += ` AND r.capacity >= ?`
		args = append(args, filter.MinCapacity)
	}
	if filter.Search != "" {
		where += ` AND r.name LIKE ?`
		args = append(args, "%"+filter.Search+"%")
	}

	var total int
	if err := r.db.Get(&total, `SELECT COUNT(*) FROM rooms r`+where, args...); err != nil {
		return nil, 0, err
	}

	var rooms []model.Room
	query := `SELECT r.* FROM rooms r` + where + ` ORDER BY ` + sortRoomsAdmin(filter.Sort) + ` LIMIT ? OFFSET ?`
	args = append(args, limit, (page-1)*limit)
	if err := r.db.Select(&rooms, query, args...); err != nil {
		return nil, 0, err
	}
	return rooms, total, nil
}

// sortRoomsAdmin maps a frontend sort key to a safe ORDER BY clause.
func sortRoomsAdmin(sort string) string {
	switch sort {
	case "room_asc":
		return `r.name ASC`
	case "price_low":
		return `r.price_per_night ASC, r.name ASC`
	case "price_high":
		return `r.price_per_night DESC, r.name ASC`
	case "newest", "":
		return `r.created_at DESC`
	default:
		return `r.created_at DESC`
	}
}

func (r *roomRepository) CountActiveBookings(roomID int64) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM bookings WHERE room_id = ? AND status IN ('pending','confirmed')`
	err := r.db.Get(&count, query, roomID)
	return count, err
}

func (r *roomRepository) AddRoomPhotos(roomID int64, urls []string) ([]model.RoomPhoto, error) {
	photos := make([]model.RoomPhoto, 0, len(urls))
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	for i, url := range urls {
		res, err := tx.Exec(
			`INSERT INTO room_photos (room_id, url, is_primary, sort_order) VALUES (?, ?, FALSE, ?)`,
			roomID, url, i)
		if err != nil {
			return nil, err
		}
		id, _ := res.LastInsertId()
		photos = append(photos, model.RoomPhoto{ID: id, RoomID: roomID, URL: url, SortOrder: i})
	}
	return photos, tx.Commit()
}

func (r *roomRepository) DeleteRoomPhoto(photoID int64) error {
	query := `DELETE FROM room_photos WHERE id = ?`
	_, err := r.db.Exec(query, photoID)
	return err
}

// SetPrimaryPhoto unsets the old primary photo and sets the new one in one transaction.
func (r *roomRepository) SetPrimaryPhoto(roomID, photoID int64) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE room_photos SET is_primary = FALSE WHERE room_id = ?`, roomID); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE room_photos SET is_primary = TRUE WHERE id = ? AND room_id = ?`, photoID, roomID); err != nil {
		return err
	}
	return tx.Commit()
}

// SyncRoomFacilities deletes all old pivot rows and re-inserts the new set.
func (r *roomRepository) SyncRoomFacilities(roomID int64, facilityIDs []int64) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	return syncFacilitiesTx(tx, roomID, facilityIDs)
}

func syncFacilitiesTx(tx *sqlx.Tx, roomID int64, facilityIDs []int64) error {
	if _, err := tx.Exec(`DELETE FROM room_facilities WHERE room_id = ?`, roomID); err != nil {
		return err
	}
	for _, fid := range facilityIDs {
		if _, err := tx.Exec(`INSERT INTO room_facilities (room_id, facility_id) VALUES (?, ?)`, roomID, fid); err != nil {
			return fmt.Errorf("invalid facility id %d: %w", fid, err)
		}
	}
	return nil
}

// SearchAvailableRooms is the core search: rooms free for [checkIn, checkOut)
// matching static filters (capacity >= guests, room type, price range, ALL facilities).
func (r *roomRepository) SearchAvailableRooms(
	checkIn, checkOut time.Time, guests int,
	roomTypeID *int64, minPrice, maxPrice *float64,
	facilityIDs []int64, sort string, page, limit int,
) ([]model.Room, int, error) {
	where := strings.Builder{}
	where.WriteString(` WHERE r.deleted_at IS NULL AND r.status = 'available' AND r.capacity >= ?`)
	args := []interface{}{guests}

	if roomTypeID != nil {
		where.WriteString(` AND r.room_type_id = ?`)
		args = append(args, *roomTypeID)
	}
	if minPrice != nil {
		where.WriteString(` AND r.price_per_night >= ?`)
		args = append(args, *minPrice)
	}
	if maxPrice != nil {
		where.WriteString(` AND r.price_per_night <= ?`)
		args = append(args, *maxPrice)
	}
	if len(facilityIDs) > 0 {
		placeholders := strings.TrimRight(strings.Repeat("?,", len(facilityIDs)), ",")
		where.WriteString(fmt.Sprintf(
			` AND (SELECT COUNT(DISTINCT facility_id) FROM room_facilities WHERE room_id = r.id AND facility_id IN (%s)) = %d`,
			placeholders, len(facilityIDs)))
		for _, fid := range facilityIDs {
			args = append(args, fid)
		}
	}
	// Exclude rooms with any active booking night overlapping the range.
	where.WriteString(` AND NOT EXISTS (
		SELECT 1 FROM booking_nights bn
		JOIN bookings b ON b.id = bn.booking_id
		WHERE bn.room_id = r.id AND b.status IN ('pending','confirmed')
		AND bn.stay_date >= ? AND bn.stay_date < ?)`)
	args = append(args, checkIn.Format("2006-01-02"), checkOut.Format("2006-01-02"))

	var total int
	if err := r.db.Get(&total, `SELECT COUNT(*) FROM rooms r`+where.String(), args...); err != nil {
		return nil, 0, err
	}

	orderBy := `r.price_per_night ASC, r.name ASC`
	switch sort {
	case "price_high":
		orderBy = `r.price_per_night DESC, r.name ASC`
	case "newest":
		orderBy = `r.created_at DESC`
	}
	query := `SELECT r.* FROM rooms r` + where.String() + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`
	args = append(args, limit, (page-1)*limit)

	var rooms []model.Room
	if err := r.db.Select(&rooms, query, args...); err != nil {
		return nil, 0, err
	}
	return rooms, total, nil
}

