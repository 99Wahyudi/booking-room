package model

import "time"

type RoomType struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type RoomPhoto struct {
	ID        int64     `json:"id" db:"id"`
	RoomID    int64     `json:"room_id" db:"room_id"`
	URL       string    `json:"url" db:"url"`
	IsPrimary bool      `json:"is_primary" db:"is_primary"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Facility struct {
	ID        int64     `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Icon      string    `json:"icon" db:"icon"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Room struct {
	ID             int64      `json:"id" db:"id"`
	RoomTypeID     int64      `json:"room_type_id" db:"room_type_id"`
	Name           string     `json:"name" db:"name"`
	PricePerNight  float64    `json:"price_per_night" db:"price_per_night"`
	Capacity       int        `json:"capacity" db:"capacity"`
	Status         string     `json:"status" db:"status"`
	Description    string     `json:"description" db:"description"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at" db:"deleted_at"`

	// Relasi (di-join saat query)
	RoomType   *RoomType    `json:"room_type,omitempty" db:"-"`
	Photos     []RoomPhoto  `json:"photos,omitempty" db:"-"`
	Facilities []Facility   `json:"facilities,omitempty" db:"-"`
}
