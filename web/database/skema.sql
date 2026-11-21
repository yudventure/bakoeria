-- Skema database Bakoeria Dive Resort (MySQL/MariaDB).
-- Aplikasi membuat tabel ini sendiri saat pertama terhubung. Berkas ini hanya
-- cadangan bila ingin membuatnya lewat phpMyAdmin (menu Import).

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  room_type VARCHAR(80) NULL,
  cap_adult TINYINT UNSIGNED NOT NULL DEFAULT 2,
  cap_child TINYINT UNSIGNED NOT NULL DEFAULT 0,
  base_rate DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  inactive_reason VARCHAR(200) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY rooms_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seasonal_rates (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  room_id VARCHAR(32) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  rate DECIMAL(14,2) NOT NULL,
  label VARCHAR(80) NULL,
  KEY seasonal_room (room_id, date_from),
  CONSTRAINT seasonal_room_fk FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(60) NULL,
  email VARCHAR(160) NULL,
  origin VARCHAR(120) NULL,
  dive_cert VARCHAR(120) NULL,
  notes TEXT NULL,
  KEY guests_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  code VARCHAR(16) NOT NULL,
  room_id VARCHAR(32) NOT NULL,
  guest_id VARCHAR(32) NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'TENTATIVE',
  source VARCHAR(10) NOT NULL DEFAULT 'MANUAL',
  external_uid VARCHAR(255) NULL,
  pax SMALLINT UNSIGNED NULL,
  dives SMALLINT UNSIGNED NULL,
  total_amount DECIMAL(14,2) NULL,
  ota_commission_est DECIMAL(14,2) NULL,
  notes TEXT NULL,
  hold_expires_at DATETIME(3) NULL,
  conflict_group VARCHAR(80) NULL,
  created_by VARCHAR(120) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY bookings_code (code),
  UNIQUE KEY bookings_external_uid (external_uid),
  KEY bookings_room_dates (room_id, check_in, check_out),
  KEY bookings_status (status),
  KEY bookings_dates (check_in, check_out),
  CONSTRAINT bookings_room_fk FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT bookings_guest_fk FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
  CONSTRAINT bookings_range CHECK (check_out > check_in)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(32) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  kind VARCHAR(10) NOT NULL,
  method VARCHAR(12) NOT NULL,
  paid_at DATE NOT NULL,
  reference VARCHAR(200) NULL,
  recorded_by VARCHAR(120) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY payments_booking (booking_id),
  KEY payments_paid (paid_at),
  CONSTRAINT payments_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ical_feeds (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  room_id VARCHAR(32) NOT NULL,
  direction VARCHAR(8) NOT NULL,
  url TEXT NULL,
  export_token VARCHAR(40) NULL,
  ota_label VARCHAR(60) NULL,
  last_success_at DATETIME(3) NULL,
  last_error_at DATETIME(3) NULL,
  last_error TEXT NULL,
  fail_count INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY ical_token (export_token),
  KEY ical_room (room_id),
  CONSTRAINT ical_room_fk FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_runs (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  feed_id VARCHAR(32) NOT NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at DATETIME(3) NULL,
  events_seen INT NOT NULL DEFAULT 0,
  created_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  cancelled_count INT NOT NULL DEFAULT 0,
  error TEXT NULL,
  KEY sync_feed (feed_id, started_at),
  CONSTRAINT sync_feed_fk FOREIGN KEY (feed_id) REFERENCES ical_feeds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  entity VARCHAR(30) NOT NULL,
  entity_id VARCHAR(32) NOT NULL,
  action VARCHAR(30) NOT NULL,
  actor VARCHAR(120) NULL,
  diff_json LONGTEXT NULL,
  at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_entity (entity, entity_id),
  KEY audit_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
