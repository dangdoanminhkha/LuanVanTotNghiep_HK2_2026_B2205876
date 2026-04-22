-- Tạo bảng reviews với 4 phần đánh giá riêng biệt
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_item_id INT NOT NULL, -- Đảm bảo chỉ review sản phẩm đã mua
    
    -- 4 phần đánh giá chính
    material_rating INT CHECK (material_rating >= 1 AND material_rating <= 5),
    material_comment TEXT,
    
    color_rating INT CHECK (color_rating >= 1 AND color_rating <= 5),
    color_comment TEXT,
    
    description_rating INT CHECK (description_rating >= 1 AND description_rating <= 5),
    description_comment TEXT,
    
    general_comment TEXT, -- Bình luận tự do
    
    -- Metadata
    overall_rating DECIMAL(2,1) AS (
        (material_rating + color_rating + description_rating) / 3
    ) STORED, -- Tính điểm trung bình tự động
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    
    -- Đảm bảo mỗi order_item chỉ review 1 lần
    UNIQUE KEY unique_review_per_item (order_item_id)
);

-- Tạo index để tăng tốc query
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);