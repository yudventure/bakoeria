/**
 * Tabel database MySQL Bakoeria. Dibuat sendiri pada koneksi pertama
 * (CREATE TABLE IF NOT EXISTS), jadi database baru di hPanel tidak perlu
 * diimpor manual. Salinan untuk phpMyAdmin: web/database/skema.sql.
 *
 * Tanggal menginap disimpan sebagai DATE dan dibaca sebagai teks
 * "YYYY-MM-DD", tidak pernah lewat zona waktu. Rentangnya setengah terbuka
 * [check_in, check_out). Waktu lain disimpan UTC.
 *
 * MySQL tidak punya EXCLUDE seperti PostgreSQL, jadi pencegah pesanan ganda
 * ada di lib/server/buku.ts: setiap penyimpanan mengunci baris kamarnya
 * (SELECT ... FOR UPDATE) di dalam transaksi lalu memeriksa tumpang tindih.
 */
const T = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

export const SKEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    room_type VARCHAR(80) NULL,
    cap_adult TINYINT UNSIGNED NOT NULL DEFAULT 2,
    cap_child TINYINT UNSIGNED NOT NULL DEFAULT 0,
    base_rate DECIMAL(14,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    inactive_reason VARCHAR(200) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    size_m2 SMALLINT UNSIGNED NULL,
    desc_en TEXT NULL,
    desc_id TEXT NULL,
    features_en TEXT NULL,
    features_id TEXT NULL,
    normal_rate DECIMAL(14,2) NULL,
    UNIQUE KEY rooms_name (name)
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS seasonal_rates (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    room_id VARCHAR(32) NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    rate DECIMAL(14,2) NOT NULL,
    label VARCHAR(80) NULL,
    KEY seasonal_room (room_id, date_from),
    CONSTRAINT seasonal_room_fk FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS guests (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(60) NULL,
    email VARCHAR(160) NULL,
    origin VARCHAR(120) NULL,
    dive_cert VARCHAR(120) NULL,
    notes TEXT NULL,
    KEY guests_name (name)
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS bookings (
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
    pax_child TINYINT UNSIGNED NULL,
    pax_infant TINYINT UNSIGNED NULL,
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
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS payments (
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
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS ical_feeds (
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
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS sync_runs (
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
  ) ${T}`,
  /* Kupon diskon untuk pemesanan dari website. Pemakaian dihitung dari bookings.coupon_code. */
  `CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    code VARCHAR(24) NOT NULL,
    kind VARCHAR(10) NOT NULL,
    value DECIMAL(14,2) NOT NULL,
    max_discount DECIMAL(14,2) NULL,
    min_nights SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    valid_until DATE NULL,
    arrive_from DATE NULL,
    arrive_to DATE NULL,
    room_types VARCHAR(400) NULL,
    max_uses INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    note VARCHAR(200) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY coupons_code (code)
  ) ${T}`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    entity VARCHAR(30) NOT NULL,
    entity_id VARCHAR(32) NOT NULL,
    action VARCHAR(30) NOT NULL,
    actor VARCHAR(120) NULL,
    diff_json LONGTEXT NULL,
    at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY audit_entity (entity, entity_id),
    KEY audit_at (at)
  ) ${T}`,
];

/**
 * Kolom yang ditambahkan setelah rilis pertama. `CREATE TABLE IF NOT EXISTS`
 * tidak menambah kolom ke tabel yang sudah ada, jadi kolom yang belum ada
 * ditambahkan satu per satu (cara ini jalan di MySQL maupun MariaDB).
 */
export const KOLOM_TAMBAHAN: [tabel: string, kolom: string, definisi: string][] = [
  ["rooms", "size_m2", "SMALLINT UNSIGNED NULL"],
  ["rooms", "desc_en", "TEXT NULL"],
  ["rooms", "desc_id", "TEXT NULL"],
  ["rooms", "features_en", "TEXT NULL"],
  ["rooms", "features_id", "TEXT NULL"],
  /* Harga sebelum promo (ditampilkan dicoret); kosong bila tidak ada promo. */
  ["rooms", "normal_rate", "DECIMAL(14,2) NULL"],
  /* Rincian tamu: anak 5 tahun ke atas (50% harga kamar, extra bed) dan balita di bawah 5 tahun (gratis). pax = jumlah semua tamu. */
  ["bookings", "pax_child", "TINYINT UNSIGNED NULL"],
  ["bookings", "pax_infant", "TINYINT UNSIGNED NULL"],
  /* Kupon yang dipakai pesanan website dan besar potongannya (total_amount sudah dikurangi). */
  ["bookings", "coupon_code", "VARCHAR(24) NULL"],
  ["bookings", "discount_amount", "DECIMAL(14,2) NULL"],
];
