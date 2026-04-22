-- Đơn giản hóa bảng reviews: chỉ giữ 1 rating + 1 comment
-- Xóa các cột rating và comment riêng lẻ

-- Bước 1: Xóa overall_rating (generated column phụ thuộc vào các cột khác)
-- ĐÃ HOÀN THÀNH trong lần chạy trước

-- Bước 2: Xóa các cột rating riêng lẻ còn lại
-- material_rating đã bị xóa trong lần chạy trước
ALTER TABLE reviews DROP COLUMN color_rating;
ALTER TABLE reviews DROP COLUMN description_rating;

-- Bước 3: Xóa các cột comment riêng lẻ
ALTER TABLE reviews DROP COLUMN color_comment;
ALTER TABLE reviews DROP COLUMN description_comment;

-- Bước 4: Tạo lại overall_rating như cột bình thường (không phải generated)
ALTER TABLE reviews ADD COLUMN overall_rating DECIMAL(2,1) DEFAULT 5.0 AFTER order_item_id;

-- Bảng reviews giờ chỉ còn:
-- id, user_id, product_id, order_item_id, 
-- overall_rating (cột bình thường, người dùng nhập), 
-- general_comment, 
-- created_at, updated_at
