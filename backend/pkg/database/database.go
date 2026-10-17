package database

import (
	"fmt"
	"log"

	"booking-room-be/config"
	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"
)

var DB *sqlx.DB

func ConnectDB() error {
	cfg := config.DBCfg()

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?parseTime=true&loc=Local",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Name,
	)

	var err error
	DB, err = sqlx.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("error opening database: %w", err)
	}

	DB.SetMaxOpenConns(cfg.MaxOpenConn)
	DB.SetMaxIdleConns(cfg.MaxIdleConn)
	DB.SetConnMaxLifetime(cfg.MaxConnLifetime)

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("error pinging database: %w", err)
	}

	log.Println("Successfully connected to MySQL")
	return nil
}

func GetDB() *sqlx.DB {
	return DB
}
