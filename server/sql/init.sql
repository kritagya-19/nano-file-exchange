-- ============================================
-- Nano File Exchange — Database Schema
-- Matches ER Diagram (6 entities + 1 junction)
-- ============================================

USE nano_exchange;

-- 1. Admin Entity
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL
);

-- 2. User Entity
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. File Entity
CREATE TABLE IF NOT EXISTS files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    file_path VARCHAR(500),
    cloud_url VARCHAR(500),
    user_id INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Storage_details Entity (1:1 with Files)
CREATE TABLE IF NOT EXISTS storage_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL UNIQUE,
    sender_id INT NOT NULL,
    file_type VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Group Entity
CREATE TABLE IF NOT EXISTS `groups` (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. Group_members (Junction: M:M Users <-> Groups)
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_membership (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 7. Message Entity
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    sender_id INT NOT NULL,
    msg_type ENUM('text', 'file', 'media') DEFAULT 'text',
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Seed: Default Admin (password: admin123)
INSERT INTO admins (password_hash) 
VALUES ('$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE admin_id = admin_id;
