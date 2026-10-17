package model

import "time"

type Booking struct {
	ID           int64     `json:"id" db:"id"`
	RoomID       int64     `json:"room_id" db:"room_id"`
	UserID       int64     `json:"user_id" db:"user_id"`
	CheckInDate  time.Time `json:"check_in_date" db:"check_in_date"`
	CheckOutDate time.Time `json:"check_out_date" db:"check_out_date"`
	Guests       int       `json:"guests" db:"guests"`
	Status       string    `json:"status" db:"status"`
	Notes        string    `json:"notes" db:"notes"`
	TotalPrice   float64   `json:"total_price" db:"total_price"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`

	// Relasi (di-join saat query)
	Room *Room `json:"room,omitempty" db:"-"`
	User *User `json:"user,omitempty" db:"-"`
}

type BookingNight struct {
	ID        int64     `json:"id" db:"id"`
	BookingID int64     `json:"booking_id" db:"booking_id"`
	RoomID    int64     `json:"room_id" db:"room_id"`
	StayDate  time.Time `json:"stay_date" db:"stay_date"`
}
