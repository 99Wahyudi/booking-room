package repository

import (
	"booking-room-be/app/model"

	"github.com/jmoiron/sqlx"
)

type FacilityRepository interface {
	FindAll() ([]model.Facility, error)
	FindByID(id int64) (*model.Facility, error)
	Create(f *model.Facility) error
	Update(f *model.Facility) error
	Delete(id int64) error
}

type facilityRepository struct {
	db *sqlx.DB
}

func NewFacilityRepository(db *sqlx.DB) FacilityRepository {
	return &facilityRepository{db: db}
}

func (r *facilityRepository) FindAll() ([]model.Facility, error) {
	var facilities []model.Facility
	query := `SELECT * FROM facilities ORDER BY name`
	err := r.db.Select(&facilities, query)
	return facilities, err
}

func (r *facilityRepository) FindByID(id int64) (*model.Facility, error) {
	var f model.Facility
	query := `SELECT * FROM facilities WHERE id = ?`
	if err := r.db.Get(&f, query, id); err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *facilityRepository) Create(f *model.Facility) error {
	query := `INSERT INTO facilities (name, icon) VALUES (:name, :icon)`
	res, err := r.db.NamedExec(query, f)
	if err != nil {
		return err
	}
	f.ID, err = res.LastInsertId()
	return err
}

func (r *facilityRepository) Update(f *model.Facility) error {
	query := `UPDATE facilities SET name = :name, icon = :icon WHERE id = :id`
	_, err := r.db.NamedExec(query, f)
	return err
}

func (r *facilityRepository) Delete(id int64) error {
	query := `DELETE FROM facilities WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}

