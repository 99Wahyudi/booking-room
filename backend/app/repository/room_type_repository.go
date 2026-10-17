package repository

import (
	"booking-room-be/app/model"

	"github.com/jmoiron/sqlx"
)

type RoomTypeRepository interface {
	FindAll() ([]model.RoomType, error)
	FindByID(id int64) (*model.RoomType, error)
	Create(rt *model.RoomType) error
	Update(rt *model.RoomType) error
	Delete(id int64) error
	CountRoomsUsing(typeID int64) (int, error)
}

type roomTypeRepository struct {
	db *sqlx.DB
}

func NewRoomTypeRepository(db *sqlx.DB) RoomTypeRepository {
	return &roomTypeRepository{db: db}
}

func (r *roomTypeRepository) FindAll() ([]model.RoomType, error) {
	var types []model.RoomType
	query := `SELECT * FROM room_types ORDER BY name`
	err := r.db.Select(&types, query)
	return types, err
}

func (r *roomTypeRepository) FindByID(id int64) (*model.RoomType, error) {
	var rt model.RoomType
	query := `SELECT * FROM room_types WHERE id = ?`
	if err := r.db.Get(&rt, query, id); err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *roomTypeRepository) Create(rt *model.RoomType) error {
	query := `INSERT INTO room_types (name, description) VALUES (:name, :description)`
	res, err := r.db.NamedExec(query, rt)
	if err != nil {
		return err
	}
	rt.ID, err = res.LastInsertId()
	return err
}

func (r *roomTypeRepository) Update(rt *model.RoomType) error {
	query := `UPDATE room_types SET name = :name, description = :description WHERE id = :id`
	_, err := r.db.NamedExec(query, rt)
	return err
}

func (r *roomTypeRepository) Delete(id int64) error {
	query := `DELETE FROM room_types WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *roomTypeRepository) CountRoomsUsing(typeID int64) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM rooms WHERE room_type_id = ? AND deleted_at IS NULL`
	err := r.db.Get(&count, query, typeID)
	return count, err
}

