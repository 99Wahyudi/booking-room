package server

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"booking-room-be/app/http/middleware"
	"booking-room-be/app/service"
	"booking-room-be/config"
	"booking-room-be/pkg/database"
	"booking-room-be/pkg/jwt"
	"booking-room-be/pkg/logger"
	route "booking-room-be/route/api"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func Serve() {
	appCfg := config.AppCfg()

	// Apply JWT config from environment
	jwt.SetSecretKey(appCfg.JWTSecretKey)
	if appCfg.JWTSecretExpireMinutesCount > 0 {
		jwt.SetExpireDuration(time.Duration(appCfg.JWTSecretExpireMinutesCount) * time.Minute)
	}

	logger.SetUpLogger()
	logr := logger.GetLogger()

	if err := database.ConnectDB(); err != nil {
		logr.Panicf("failed database setup. error: %v", err)
	}

	fiberCfg := config.FiberConfig()
	app := fiber.New(fiberCfg)

	middleware.FiberMiddleware(app)

	route.Auth(app)
	route.Public(app)
	route.BookingRoutes(app)
	route.RoomRoutes(app)
	route.AdminRoutes(app)

	// Serve uploaded room photos
	app.Static("/uploads", "storage/uploads")

	// Not found route
	route.NotFoundRoute(app)

	go startAutoCompleteTicker(logr)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT, syscall.SIGQUIT)

	go func() {
		<-sigCh
		logr.Infoln("Shutting down server...")
		_ = app.Shutdown()
	}()

	serverAddr := fmt.Sprintf("%s:%d", appCfg.Host, appCfg.Port)
	if err := app.Listen(serverAddr); err != nil {
		logr.Errorf("Oops... server is not running! error: %v", err)
	}
}

// startAutoCompleteTicker periodically transitions confirmed bookings whose
// check-out date has passed into completed. It also backfills overdue
// bookings once on startup, so downtime across check-out dates is caught up.
func startAutoCompleteTicker(logr *logrus.Logger) {
	bookingSvc := service.NewBookingService(database.GetDB())

	run := func() {
		n, err := bookingSvc.AutoCompleteExpired()
		if err != nil {
			logr.Errorf("auto-complete bookings error: %v", err)
			return
		}
		if n > 0 {
			logr.Infof("auto-completed %d booking(s) to 'completed'", n)
		}
	}

	run()
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		run()
	}
}
