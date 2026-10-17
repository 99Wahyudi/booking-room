package config

import (
	"time"
)

type DB struct {
	Host            string
	Port            int
	Name            string
	User            string
	Password        string
	Debug           bool
	MaxOpenConn     int
	MaxIdleConn     int
	MaxConnLifetime time.Duration
}

var db = &DB{}

func DBCfg() *DB {
	return db
}

func LoadDBCfg() {
	db.Host = getEnv("DB_HOST", "localhost")
	db.Port = getEnvInt("DB_PORT", 3306)
	db.User = getEnv("DB_USER", "root")
	db.Password = getEnv("DB_PASSWORD", "")
	db.Name = getEnv("DB_NAME", "booking_room")
	db.Debug = getEnvBool("DB_DEBUG", false)
	db.MaxOpenConn = getEnvInt("DB_MAX_OPEN_CONN", 25)
	db.MaxIdleConn = getEnvInt("DB_MAX_IDLE_CONN", 25)
	db.MaxConnLifetime = time.Duration(getEnvInt("DB_MAX_CONN_LIFETIME", 5)) * time.Minute
}
