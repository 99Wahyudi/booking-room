package service

import (
	"booking-room-be/app/model"
	"booking-room-be/pkg/jwt"
)

// generateJWTFor creates a JWT with user_id & role claims.
func generateJWTFor(user *model.User) (string, error) {
	return jwt.GenerateJWT(user.ID, user.Role)
}

