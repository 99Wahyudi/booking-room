package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

var log *logrus.Logger

func SetUpLogger() {
	log = logrus.New()
	log.SetOutput(os.Stdout)
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
	})
	log.SetLevel(logrus.InfoLevel)
}

func GetLogger() *logrus.Logger {
	return log
}
