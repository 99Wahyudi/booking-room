package service

import (
	"booking-room-be/app/model"
	"booking-room-be/app/repository"

	"github.com/jmoiron/sqlx"
)

type FacilityService struct {
	repo repository.FacilityRepository
}

func NewFacilityService(db *sqlx.DB) *FacilityService {
	return &FacilityService{repo: repository.NewFacilityRepository(db)}
}

func (s *FacilityService) CreateFacility(name, icon string) (*model.Facility, error) {
	if name == "" {
		return nil, ErrBadRequest
	}
	f := &model.Facility{Name: name, Icon: icon}
	if err := s.repo.Create(f); err != nil {
		return nil, err
	}
	return f, nil
}

func (s *FacilityService) GetAllFacilities() ([]model.Facility, error) {
	return s.repo.FindAll()
}

func (s *FacilityService) UpdateFacility(id int64, name, icon string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrNotFound
	}
	f := &model.Facility{ID: id, Name: name, Icon: icon}
	return s.repo.Update(f)
}

func (s *FacilityService) DeleteFacility(id int64) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrNotFound
	}
	return s.repo.Delete(id)
}
