package service

import (
	"booking-room-be/app/model"
	"booking-room-be/app/repository"

	"github.com/jmoiron/sqlx"
)

type RoomTypeService struct {
	repo repository.RoomTypeRepository
}

func NewRoomTypeService(db *sqlx.DB) *RoomTypeService {
	return &RoomTypeService{repo: repository.NewRoomTypeRepository(db)}
}

func (s *RoomTypeService) CreateRoomType(name, description string) (*model.RoomType, error) {
	if name == "" {
		return nil, ErrBadRequest
	}
	rt := &model.RoomType{Name: name, Description: description}
	if err := s.repo.Create(rt); err != nil {
		return nil, err
	}
	return rt, nil
}

func (s *RoomTypeService) GetAllRoomTypes() ([]model.RoomType, error) {
	return s.repo.FindAll()
}

func (s *RoomTypeService) UpdateRoomType(id int64, name, description string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrNotFound
	}
	rt := &model.RoomType{ID: id, Name: name, Description: description}
	return s.repo.Update(rt)
}

// DeleteRoomType rejects deletion when active rooms still use it.
func (s *RoomTypeService) DeleteRoomType(id int64) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrNotFound
	}
	count, err := s.repo.CountRoomsUsing(id)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrRoomInUse
	}
	return s.repo.Delete(id)
}
