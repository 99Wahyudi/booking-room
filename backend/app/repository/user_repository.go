package repository

import (
	"booking-room-be/app/model"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type UserRepository interface {
	GetByID(id int64) (*model.User, error)
	GetByEmail(email string) (*model.User, error)
	Create(user *model.User) error
	Update(user *model.User) error
	Delete(id int64) error
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByID(id int64) (*model.User, error) {
	var user model.User
	query := `SELECT * FROM users WHERE id = ?`
	err := r.db.Get(&user, query, id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByIDString(idStr string) (*model.User, error) {
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

func (r *userRepository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	query := `SELECT * FROM users WHERE email = ?`
	err := r.db.Get(&user, query, email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Create(user *model.User) error {
	query := `INSERT INTO users (name, email, password_hash, phone, role)
		VALUES (:name, :email, :password_hash, :phone, :role)`
	res, err := r.db.NamedExec(query, user)
	if err != nil {
		return err
	}
	user.ID, err = res.LastInsertId()
	return err
}

func (r *userRepository) Update(user *model.User) error {
	query := `UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :id`
	_, err := r.db.NamedExec(query, user)
	return err
}

func (r *userRepository) Delete(id int64) error {
	query := `DELETE FROM users WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}
