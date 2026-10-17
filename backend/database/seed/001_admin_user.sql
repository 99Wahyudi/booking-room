-- =============================================================================
-- Seed: Admin user untuk StayEasy Admin Portal
-- -----------------------------------------------------------------------------
-- IDEMPOTENT: email 'admin@hotel.com' adalah UNIQUE, jadi scrinario konekz
--   - user belum ada  -> INSERT baru (role admin)
--   - user sudah ada  -> UPDATE password sehingga password di-set kata admin123
--
-- CATEGORIA: dev/demo only. Hapus atau hange kata sandi melalu UI setelah masuk.
-- Password plaintext: admin123   (hash bcrypt $2y, kompatibel dengan backend Go)
-- =============================================================================

INSERT INTO users (name, email, password_hash, phone, role)
VALUES (
  'Admin',
  'admin@hotel.com',
  '$2y$10$s/ONnp.i5iSyn44T.xZ27eA6GItVfNB8QqIfeWTRKjliGuy89ieJm',
  '0800000000',
  'admin'
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  name          = VALUES(name),
  role          = VALUES(role);