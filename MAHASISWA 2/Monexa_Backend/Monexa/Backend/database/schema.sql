-- Skema database MONEXA CloudWallet
-- Jalankan: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS cloudwallet;
USE cloudwallet;

CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'user',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT           NOT NULL UNIQUE,
    balance    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency   CHAR(3)       NOT NULL DEFAULT 'IDR',
    status     VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_balance CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS transactions (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id         INT           NOT NULL,
    type              ENUM('TOPUP','TRANSFER_OUT','TRANSFER_IN','PAYMENT') NOT NULL,
    amount            DECIMAL(15,2) NOT NULL,
    status            ENUM('SUCCESS','FAILED','PENDING') NOT NULL DEFAULT 'SUCCESS',
    related_wallet_id INT           NULL,
    reference_code    CHAR(36)      NULL,
    description       VARCHAR(255)  NULL,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_wallet  FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    INDEX idx_tx_wallet_date (wallet_id, created_at)
);

-- Kalau tabel transactions sudah ada dari versi sebelumnya, tambahkan kolom baru:
-- ALTER TABLE transactions
--     MODIFY type ENUM('TOPUP','TRANSFER_OUT','TRANSFER_IN','PAYMENT') NOT NULL,
--     ADD COLUMN related_wallet_id INT NULL,
--     ADD COLUMN reference_code CHAR(36) NULL,
--     ADD COLUMN description VARCHAR(255) NULL,
--     ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
