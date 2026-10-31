-- CivicVoice MySQL schema.
-- Run this file inside the target database, for example:
--   mysql -u civicvoice -p civicvoice < backend/schema.sql
-- The database itself is created separately; see backend/README.md.

CREATE TABLE IF NOT EXISTS complaints (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    reference_number VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    location VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Submitted',
    sentiment_label VARCHAR(12) NULL,
    sentiment_score DECIMAL(7, 4) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_complaints_reference (reference_number),
    KEY idx_complaints_status (status),
    KEY idx_complaints_category (category),
    KEY idx_complaints_location (location),
    KEY idx_complaints_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS status_history (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    complaint_id INT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL,
    note VARCHAR(500) NULL,
    updated_by VARCHAR(100) NOT NULL DEFAULT 'Admin (demo)',
    changed_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_status_history_complaint (complaint_id, changed_at),
    CONSTRAINT fk_status_history_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaint_counters (
    counter_year SMALLINT UNSIGNED NOT NULL,
    last_number INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (counter_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
