CREATE TABLE rooms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_type_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_per_night DECIMAL(12,2) NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  status ENUM('available', 'maintenance', 'inactive') NOT NULL DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  INDEX idx_rooms_status (status),
  INDEX idx_rooms_deleted_at (deleted_at)
) ENGINE=InnoDB;
