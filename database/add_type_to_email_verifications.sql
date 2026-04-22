USE shoestore;

-- Thêm cột type vào email_verifications nếu chưa có
-- type: 'verify' (xác nhận email) hoặc 'reset' (reset password)
ALTER TABLE email_verifications ADD COLUMN type VARCHAR(20) DEFAULT 'verify';

-- Tạo index để tìm kiếm nhanh theo type
CREATE INDEX idx_type ON email_verifications(type);
