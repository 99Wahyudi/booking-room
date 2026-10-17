package service

import (
	"errors"
	"strings"

	"booking-room-be/app/model"
	"booking-room-be/app/repository"

	"github.com/jmoiron/sqlx"
)

var (
	ErrEmailTaken      = errors.New("email already registered")
	ErrInvalidCred     = errors.New("invalid email or password")
	ErrNotFound        = errors.New("not found")
	ErrBadRequest      = errors.New("bad request")
	ErrForbidden       = errors.New("forbidden")
	ErrRoomInUse       = errors.New("room is still referenced by other data")
	ErrInvalidStatus   = errors.New("invalid status transition")
)

type AuthService struct {
	db     *sqlx.DB
	userRepo repository.UserRepository
}

func NewAuthService(db *sqlx.DB) *AuthService {
	return &AuthService{
		db:       db,
		userRepo: repository.NewUserRepository(db),
	}
}

// RegisterCustomer checks email availability, hashes password, inserts role='customer'.
func (s *AuthService) RegisterCustomer(name, email, password, phone string) (*model.User, error) {
	if name == "" || email == "" || password == "" {
		return nil, ErrBadRequest
	}
	if _, err := s.userRepo.GetByEmail(email); err == nil {
		return nil, ErrEmailTaken
	}

	hash, err := model.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Name:         name,
		Email:        email,
		PasswordHash: hash,
		Phone:        phone,
		Role:         "customer",
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

// LoginUser checks email & password, generates JWT.
func (s *AuthService) LoginUser(email, password string) (string, *model.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return "", nil, ErrInvalidCred
	}
	if !model.ComparePassword(user.PasswordHash, password) {
		return "", nil, ErrInvalidCred
	}

	token, err := generateJWTFor(user)
	if err != nil {
		return "", nil, err
	}
	return token, user, nil
}

func (s *AuthService) GetUserByID(id int64) (*model.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, ErrNotFound
	}
	return user, nil
}

func (s *AuthService) GetUserByEmail(email string) (*model.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, ErrNotFound
	}
	return user, nil
}

// normalizeEmail trims and lowercases an email address.
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
