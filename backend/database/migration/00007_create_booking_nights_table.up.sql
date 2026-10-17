-- Tabel kunci untuk mencegah bentrok booking di level database.
-- Setiap booking di-"expand" jadi satu baris per malam. UNIQUE KEY di bawah
-- membuat MySQL menolak insert kalau ada malam yang sudah terisi untuk room yang sama.
CREATE TABLE booking_nights (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  stay_date DATE NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  UNIQUE KEY uq_room_stay_date (room_id, stay_date)
) ENGINE=InnoDB;
