package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

type App struct {
	Host        string
	Port        int
	Debug       bool
	ReadTimeout time.Duration

	JWTSecretKey                string
	JWTSecretExpireMinutesCount int
}

var app = &App{}

func AppCfg() *App {
	return app
}

func LoadApp() {
	app.Host = getEnv("APP_HOST", "0.0.0.0")
	app.Port = getEnvInt("APP_PORT", 8080)
	app.Debug = getEnvBool("APP_DEBUG", false)
	timeout := getEnvInt("APP_READ_TIMEOUT", 30)
	app.ReadTimeout = time.Duration(timeout) * time.Second

	app.JWTSecretKey = getEnv("JWT_SECRET_KEY", "your-secret-key")
	app.JWTSecretExpireMinutesCount = getEnvInt("JWT_SECRET_KEY_EXPIRE_MINUTES_COUNT", 60)
}

func LoadAllConfigs(envFile string) {
	err := godotenv.Load(envFile)
	if err != nil {
		log.Fatalf("can't load .env file. error: %v", err)
	}

	LoadApp()
	LoadDBCfg()
}

func FiberConfig() fiber.Config {
	return fiber.Config{
		ReadTimeout: time.Second * time.Duration(AppCfg().ReadTimeout),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var val int
		_, err := sscanfInt(value, &val)
		if err == nil {
			return val
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		var val bool
		_, err := sscanfBool(value, &val)
		if err == nil {
			return val
		}
	}
	return defaultValue
}

func sscanfInt(s string, i *int) (int, error) {
	val, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	*i = val
	return val, nil
}

func sscanfBool(s string, b *bool) (int, error) {
	val, err := strconv.ParseBool(s)
	if err != nil {
		return 0, err
	}
	*b = val
	return 1, nil
}
