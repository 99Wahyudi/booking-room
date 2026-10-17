package service

import (
	"time"

	"booking-room-be/app/model"
	"booking-room-be/app/repository"

	"github.com/jmoiron/sqlx"
)

type RoomService struct {
	repo repository.RoomRepository
}

func NewRoomService(db *sqlx.DB) *RoomService {
	return &RoomService{repo: repository.NewRoomRepository(db)}
}

// CreateRoomInput is the DTO for creating a room.
type CreateRoomInput struct {
	RoomTypeID    int64    `json:"room_type_id"`
	Name          string   `json:"name"`
	PricePerNight float64  `json:"price_per_night"`
	Capacity      int      `json:"capacity"`
	Status        string   `json:"status"`
	Description   string   `json:"description"`
	FacilityIDs   []int64  `json:"facility_ids"`
}

// UpdateRoomInput is the DTO for updating a room (partial).
type UpdateRoomInput struct {
	RoomTypeID    *int64   `json:"room_type_id"`
	Name          *string  `json:"name"`
	PricePerNight *float64 `json:"price_per_night"`
	Capacity      *int     `json:"capacity"`
	Status        *string  `json:"status"`
	Description   *string  `json:"description"`
	FacilityIDs   []int64  `json:"facility_ids"`
}

func (s *RoomService) CreateRoom(dto CreateRoomInput) (*model.Room, error) {
	if dto.Name == "" || dto.RoomTypeID <= 0 || dto.PricePerNight <= 0 {
		return nil, ErrBadRequest
	}
	if dto.Capacity <= 0 {
		dto.Capacity = 1
	}
	if dto.Status == "" {
		dto.Status = "available"
	}

	room := &model.Room{
		RoomTypeID:    dto.RoomTypeID,
		Name:          dto.Name,
		PricePerNight: dto.PricePerNight,
		Capacity:      dto.Capacity,
		Status:        dto.Status,
		Description:   dto.Description,
	}
	if err := s.repo.CreateRoom(room, dto.FacilityIDs); err != nil {
		return nil, err
	}
	return room, nil
}

// GetRoomDetail joins room with room_type + photos + facilities.
func (s *RoomService) GetRoomDetail(id int64) (*model.Room, error) {
	room, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	room.Photos, _ = s.repo.GetPhotos(room.ID)
	room.Facilities, _ = s.repo.GetFacilities(room.ID)
	room.RoomType, _ = s.repo.GetRoomType(room.RoomTypeID)
	return room, nil
}

func (s *RoomService) UpdateRoom(id int64, dto UpdateRoomInput) error {
	room, err := s.repo.FindByID(id)
	if err != nil {
		return ErrNotFound
	}
	if dto.RoomTypeID != nil {
		room.RoomTypeID = *dto.RoomTypeID
	}
	if dto.Name != nil {
		room.Name = *dto.Name
	}
	if dto.PricePerNight != nil {
		room.PricePerNight = *dto.PricePerNight
	}
	if dto.Capacity != nil {
		room.Capacity = *dto.Capacity
	}
	if dto.Status != nil {
		room.Status = *dto.Status
	}
	if dto.Description != nil {
		room.Description = *dto.Description
	}
	if err := s.repo.UpdateRoom(room); err != nil {
		return err
	}
	if dto.FacilityIDs != nil {
		if err := s.repo.SyncRoomFacilities(id, dto.FacilityIDs); err != nil {
			return err
		}
	}
	return nil
}

// SoftDeleteRoom sets deleted_at; rejects when active bookings still exist.
func (s *RoomService) SoftDeleteRoom(id int64) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrNotFound
	}
	active, err := s.repo.CountActiveBookings(id)
	if err != nil {
		return err
	}
	if active > 0 {
		return ErrRoomInUse
	}
	return s.repo.SoftDeleteRoom(id)
}

func (s *RoomService) ListRoomsAdmin(filter repository.RoomFilter, page, limit int) ([]model.Room, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	rooms, total, err := s.repo.ListRoomsAdmin(filter, page, limit)
	if err != nil {
		return nil, 0, err
	}
	for i := range rooms {
		rooms[i].Photos, _ = s.repo.GetPhotos(rooms[i].ID)
		rooms[i].Facilities, _ = s.repo.GetFacilities(rooms[i].ID)
		rooms[i].RoomType, _ = s.repo.GetRoomType(rooms[i].RoomTypeID)
	}
	return rooms, total, nil
}

// SearchAvailableRooms is the core search with pagination.
func (s *RoomService) SearchAvailableRooms(
	checkIn, checkOut time.Time, guests int,
	roomTypeID *int64, minPrice, maxPrice *float64,
	facilityIDs []int64, sort string, page, limit int,
) ([]model.Room, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	if guests <= 0 {
		guests = 1
	}
	rooms, total, err := s.repo.SearchAvailableRooms(checkIn, checkOut, guests, roomTypeID, minPrice, maxPrice, facilityIDs, sort, page, limit)
	if err != nil {
		return nil, 0, err
	}
	for i := range rooms {
		rooms[i].Photos, _ = s.repo.GetPhotos(rooms[i].ID)
		rooms[i].Facilities, _ = s.repo.GetFacilities(rooms[i].ID)
	}
	return rooms, total, nil
}

// IsRoomAvailable is a reusable helper.
func (s *RoomService) IsRoomAvailable(roomID int64, checkIn, checkOut time.Time) (bool, error) {
	return s.repo.IsRoomAvailable(roomID, checkIn, checkOut)
}

func (s *RoomService) AddRoomPhotos(roomID int64, urls []string) ([]model.RoomPhoto, error) {
	if len(urls) == 0 {
		return nil, ErrBadRequest
	}
	if _, err := s.repo.FindByID(roomID); err != nil {
		return nil, ErrNotFound
	}
	return s.repo.AddRoomPhotos(roomID, urls)
}

func (s *RoomService) DeleteRoomPhoto(photoID int64) error {
	return s.repo.DeleteRoomPhoto(photoID)
}

func (s *RoomService) SetPrimaryPhoto(roomID, photoID int64) error {
	return s.repo.SetPrimaryPhoto(roomID, photoID)
}

func (s *RoomService) SyncRoomFacilities(roomID int64, facilityIDs []int64) error {
	if _, err := s.repo.FindByID(roomID); err != nil {
		return ErrNotFound
	}
	return s.repo.SyncRoomFacilities(roomID, facilityIDs)
}
