package controller

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// getUserID extracts the user_id (int64) injected by AuthRequired middleware.
func getUserID(c *fiber.Ctx) int64 {
	id, _ := c.Locals("user_id").(int64)
	return id
}

// getUserRole extracts the role injected by AuthRequired middleware.
func getUserRole(c *fiber.Ctx) string {
	role, _ := c.Locals("role").(string)
	return role
}

func parseID(s string) int64 {
	id, _ := strconv.ParseInt(s, 10, 64)
	return id
}

func parsePageLimit(c *fiber.Ctx) (int, int) {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	return page, limit
}

func strconvAtoi(s string) (int, error) {
	return strconv.Atoi(s)
}

func strconvParseFloat(s string) (float64, error) {
	return strconv.ParseFloat(s, 64)
}

const uploadDir = "storage/uploads"
const maxUploadSize = 5 * 1024 * 1024 // 5 MB per file

var allowedImageExt = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

// saveUploadedFiles stores the uploaded images on disk and returns public URLs.
func saveUploadedFiles(headers []*multipart.FileHeader) ([]string, error) {
	if len(headers) == 0 {
		return nil, fmt.Errorf("no files uploaded")
	}
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return nil, err
	}
	urls := make([]string, 0, len(headers))
	for _, h := range headers {
		ext := strings.ToLower(filepath.Ext(h.Filename))
		if !allowedImageExt[ext] {
			return nil, fmt.Errorf("file %q: unsupported image type (jpg/jpeg/png/webp only)", h.Filename)
		}
		if h.Size <= 0 || h.Size > maxUploadSize {
			return nil, fmt.Errorf("file %q: size out of range (max 5MB)", h.Filename)
		}
		src, err := h.Open()
		if err != nil {
			return nil, err
		}
		name := randomHex(8) + ext
		if err := saveMultipartFile(filepath.Join(uploadDir, name), src); err != nil {
			src.Close()
			return nil, err
		}
		src.Close()
		urls = append(urls, "/uploads/"+name)
	}
	return urls, nil
}

func saveMultipartFile(dest string, src io.Reader) error {
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, src)
	return err
}

func randomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return strconv.FormatInt(int64(os.Getpid()), 10)
	}
	return hex.EncodeToString(b)
}


