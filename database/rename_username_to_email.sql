-- Migration: Đổi tên cột username thành email trong bảng users
-- Vì trường username thực ra lưu email của người dùng

-- Đổi tên cột
ALTER TABLE users CHANGE COLUMN username email VARCHAR(255) NOT NULL;

-- Đảm bảo có unique index
-- (Nếu đã có unique index trên username, nó sẽ tự động chuyển sang email)
-- ALTER TABLE users ADD UNIQUE INDEX idx_email (email);

-- Xác nhận thay đổi
DESCRIBE users;
