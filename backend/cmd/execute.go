package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{Use: "app"}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:   "about",
		Short: "About App",
		Run: func(cmd *cobra.Command, args []string) {
			PrintTextFunc()
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "serve",
		Short: "Serve App",
		Run: func(cmd *cobra.Command, args []string) {
			ServeFunc()
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "seed",
		Short: "Database Seeding",
		Run: func(cmd *cobra.Command, args []string) {
			SeedFunc()
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "migrate:up",
		Short: "Migrate Up",
		Run: func(cmd *cobra.Command, args []string) {
			MigrateUpFunc()
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "migrate:down",
		Short: "Migrate Down",
		Run: func(cmd *cobra.Command, args []string) {
			step := ""
			if len(args) > 0 {
				step = args[0]
			}
			MigrateDownFunc(step)
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "migrate:fresh",
		Short: "Migrate Fresh",
		Run: func(cmd *cobra.Command, args []string) {
			MigrateFreshFunc()
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "make:migration",
		Short: "Create a new migration",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			MigrateMake(args[0])
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "make:controller",
		Short: "Create a new controller",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			MakeController(args[0])
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "make:model",
		Short: "Create a new model",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			MakeModel(args[0])
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "make:repository",
		Short: "Create a new repository",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			MakeRepository(args[0])
		},
	})

	rootCmd.AddCommand(&cobra.Command{
		Use:   "make:middleware",
		Short: "Create a new middleware",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			MakeMiddleware(args[0])
		},
	})
}
