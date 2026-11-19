-- ========================================================
-- Monexa CloudWallet Database Schema (UI/UX Aligned)
-- Author: M3 (Database & Transaction Engineer)
-- ========================================================

CREATE DATABASE IF NOT EXISTS monexa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monexa_db;

-- 1. Users Table (Sesuai form Login & Dashboard "Vino")
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) UNIQUE NULL,
    role ENUM('USER', 'MERCHANT', 'ADMIN') DEFAULT 'USER',
    status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Wallets Table (Sesuai Dashboard "Wallet ID - MX-6927-2201" & "Rp 2.450.000")
CREATE TABLE IF NOT EXISTS wallets (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    wallet_number VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    status ENUM('active', 'frozen') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_currency (user_id, currency)
) ENGINE=InnoDB;

-- 3. Transactions Table (Sesuai "Riwayat Transaksi" & "ID Transaksi: TRX-20260929-0001")
CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    source_wallet_id CHAR(36) NULL,
    destination_wallet_id CHAR(36) NULL,
    amount DECIMAL(18, 4) NOT NULL,
    fee DECIMAL(18, 4) DEFAULT 0.0000,
    type ENUM('topup', 'transfer', 'payment') NOT NULL,
    status ENUM('PENDING', 'SUKSES', 'GAGAL') DEFAULT 'PENDING',
    notes VARCHAR(255) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    INDEX idx_tx_source_date (source_wallet_id, created_at),
    INDEX idx_tx_destination_date (destination_wallet_id, created_at),
    INDEX idx_tx_type_status (type, status)
) ENGINE=InnoDB;

-- 4. Ledger Entries Table (Double-Entry Bookkeeping untuk Audit Mutasi Saldo)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id CHAR(36) PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    wallet_id CHAR(36) NOT NULL,
    type ENUM('debit', 'credit') NOT NULL,
    amount DECIMAL(18, 4) NOT NULL,
    balance_before DECIMAL(18, 4) NOT NULL,
    balance_after DECIMAL(18, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    INDEX idx_ledger_wallet_date (wallet_id, created_at),
    INDEX idx_ledger_transaction (transaction_id)
) ENGINE=InnoDB;
