package cmd

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"

	"booking-room-be/config"
	"booking-room-be/pkg/server"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
)

func PrintTextFunc() {
	fmt.Println("Booking Room BE - SQLX GoFiber Boilerplate")
}

func ServeFunc() {
	config.LoadAllConfigs(".env")
	server.Serve()
}

func SeedFunc() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("can't load .env file. error: %v", err)
	}
	config.LoadDBCfg()

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s",
		config.DBCfg().User, config.DBCfg().Password, config.DBCfg().Host,
		config.DBCfg().Port, config.DBCfg().Name,
	)

	db, err := sqlx.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("error opening a connection with the database %s\n", err)
	}
	defer db.Close()

	// Run seeder here
	// seed := seeds.NewSeed(db)
	// seed.PopulateDB()

	fmt.Println("Database seeder has successfully executed")
}

func MigrateMake(fileName string) {
	ext := "sql"
	dir := "database/migration"

	workDir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting the current working directory:", err)
		return
	}

	run := exec.Command("migrate", "create", "-ext", ext, "-dir", dir, "-seq", fileName)
	run.Dir = workDir

	output, err := run.CombinedOutput()
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(string(output))
}

func MigrateUpFunc() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("can't load .env file. error: %v", err)
	}
	config.LoadDBCfg()

	workDir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting the current working directory:", err)
		return
	}

	command := fmt.Sprintf(
		`migrate -path ./database/migration/ -database "mysql://%s:%s@tcp(%s:%d)/%s" -verbose up`,
		config.DBCfg().User, config.DBCfg().Password, config.DBCfg().Host,
		config.DBCfg().Port, config.DBCfg().Name,
	)

	run := exec.Command("cmd", "/c", command)
	run.Dir = workDir

	output, err := run.CombinedOutput()
	if err != nil {
		fmt.Println("Error:", err)
		fmt.Println("Output:", string(output))
		return
	}

	fmt.Println(string(output))
}

func MigrateDownFunc(step string) {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("can't load .env file. error: %v", err)
	}
	config.LoadDBCfg()

	workDir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting the current working directory:", err)
		return
	}

	command := ""
	if step != "" {
		number, err := strconv.Atoi(step)
		if err != nil {
			log.Fatal("Invalid number")
		}
		command = fmt.Sprintf(
			`migrate -path ./database/migration/ -database "mysql://%s:%s@tcp(%s:%d)/%s" -verbose down %d`,
			config.DBCfg().User, config.DBCfg().Password, config.DBCfg().Host,
			config.DBCfg().Port, config.DBCfg().Name, number,
		)
	} else {
		command = fmt.Sprintf(
			`migrate -path ./database/migration/ -database "mysql://%s:%s@tcp(%s:%d)/%s" -verbose down 1`,
			config.DBCfg().User, config.DBCfg().Password, config.DBCfg().Host,
			config.DBCfg().Port, config.DBCfg().Name,
		)
	}

	run := exec.Command("cmd", "/c", command)
	run.Dir = workDir

	output, err := run.CombinedOutput()
	if err != nil {
		fmt.Println("Error:", err)
		fmt.Println("Output:", string(output))
		return
	}

	fmt.Println(string(output))
}

func MigrateFreshFunc() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("can't load .env file. error: %v", err)
	}
	config.LoadDBCfg()

	dropCommand := fmt.Sprintf(
		`mysql -h %s -P %d -u %s -p%s %s -e "DROP DATABASE IF EXISTS %s; CREATE DATABASE %s;"`,
		config.DBCfg().Host, config.DBCfg().Port, config.DBCfg().User,
		config.DBCfg().Password, config.DBCfg().Name,
		config.DBCfg().Name, config.DBCfg().Name,
	)

	dropCmd := exec.Command("cmd", "/c", dropCommand)
	_ = dropCmd.Run()

	MigrateUpFunc()

	fmt.Println("Database migrated fresh successfully")
}

func MakeController(name string) {
	fmt.Printf("Creating controller: %s\n", name)
	// TODO: Implement controller generator
}

func MakeModel(name string) {
	fmt.Printf("Creating model: %s\n", name)
	// TODO: Implement model generator
}

func MakeRepository(name string) {
	fmt.Printf("Creating repository: %s\n", name)
	// TODO: Implement repository generator
}

func MakeMiddleware(name string) {
	fmt.Printf("Creating middleware: %s\n", name)
	// TODO: Implement middleware generator
}

