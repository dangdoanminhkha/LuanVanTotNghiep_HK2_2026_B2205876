USE shoestore;

-- Cập nhật ENUM payment_method để hỗ trợ vnpay (loại bỏ momo)
ALTER TABLE orders MODIFY payment_method ENUM('cod', 'bank', 'vnpay') DEFAULT 'cod';
