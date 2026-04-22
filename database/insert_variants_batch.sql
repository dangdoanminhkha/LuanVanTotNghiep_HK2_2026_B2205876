USE shoestore;

-- Xóa dữ liệu cũ nếu muốn làm sạch
-- DELETE FROM product_variants;

-- Thủ tục để insert variants hàng loạt cho nhanh
DELIMITER //

CREATE PROCEDURE InsertProductVariants()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE p_id INT;
    DECLARE p_gender VARCHAR(50);
    DECLARE p_cat_id INT;
    
    -- Cursor lấy tất cả sản phẩm
    DECLARE cur CURSOR FOR SELECT id, gender, category_id FROM products;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO p_id, p_gender, p_cat_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Quy tắc dải Size
        -- Nam: 39-43, Nữ: 35-39
        
        -- NHÓM 1: SNEAKER (category_id = 10)
        IF p_cat_id = 10 THEN
            IF p_gender = 'Nam' THEN
                -- 3 màu cho mỗi sản phẩm (Trắng, Đen, Xám)
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 20, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Trắng' as color UNION SELECT 'Đen' UNION SELECT 'Xám') c
                CROSS JOIN (SELECT '39' as size UNION SELECT '40' UNION SELECT '41' UNION SELECT '42' UNION SELECT '43') s;
            ELSE -- Nữ
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 20, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Trắng' as color UNION SELECT 'Hồng nhạt' UNION SELECT 'Kem') c
                CROSS JOIN (SELECT '35' as size UNION SELECT '36' UNION SELECT '37' UNION SELECT '38' UNION SELECT '39') s;
            END IF;

        -- NHÓM 2 & 3: GIÀY TÂY & GIÀY DA (category_id = 5 hoặc 11)
        ELSEIF p_cat_id = 5 OR p_cat_id = 11 THEN
            IF p_gender = 'Nam' THEN
                -- 3 màu (Đen, Nâu sẫm, Nâu bò)
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 15, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Đen' as color UNION SELECT 'Nâu sẫm' UNION SELECT 'Nâu bò') c
                CROSS JOIN (SELECT '40' as size UNION SELECT '41' UNION SELECT '42' UNION SELECT '43') s;
            ELSE -- Nữ
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 15, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Đen' as color UNION SELECT 'Nâu bò' UNION SELECT 'Kem') c
                CROSS JOIN (SELECT '35' as size UNION SELECT '36' UNION SELECT '37' UNION SELECT '38') s;
            END IF;

        -- NHÓM 4: GIÀY CAO GÓT (category_id = 8)
        ELSEIF p_cat_id = 8 THEN
            -- 3 màu (Nude, Đen, Đỏ)
            INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
            SELECT p_id, c.color, s.size, 10, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
            FROM (SELECT 'Nude' as color UNION SELECT 'Đen' UNION SELECT 'Đỏ') c
            CROSS JOIN (SELECT '35' as size UNION SELECT '36' UNION SELECT '37' UNION SELECT '38' UNION SELECT '39') s;

        -- NHÓM 5: SANDAL (category_id = 2)
        ELSEIF p_cat_id = 2 THEN
            IF p_gender = 'Nam' THEN
                -- 3 màu (Đen, Trắng, Xanh rêu)
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 25, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Đen' as color UNION SELECT 'Trắng' UNION SELECT 'Xanh rêu') c
                CROSS JOIN (SELECT '39' as size UNION SELECT '40' UNION SELECT '41' UNION SELECT '42' UNION SELECT '43') s;
            ELSE -- Nữ
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 25, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Kem' as color UNION SELECT 'Nâu bò' UNION SELECT 'Trắng') c
                CROSS JOIN (SELECT '35' as size UNION SELECT '36' UNION SELECT '37' UNION SELECT '38' UNION SELECT '39') s;
            END IF;

        -- NHÓM MẶC ĐỊNH (Cho tất cả các loại sản phẩm khác còn lại)
        ELSE
            IF p_gender = 'Nam' THEN
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 20, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Đen' as color UNION SELECT 'Trắng' UNION SELECT 'Nâu Bò') c
                CROSS JOIN (SELECT '39' as size UNION SELECT '40' UNION SELECT '41' UNION SELECT '42' UNION SELECT '43') s;
            ELSE -- Nữ
                INSERT IGNORE INTO product_variants (product_id, color, size, quantity, images, sku) 
                SELECT p_id, c.color, s.size, 20, '[]', CONCAT(p_id, '-', c.color, '-', s.size)
                FROM (SELECT 'Đen' as color UNION SELECT 'Trắng' UNION SELECT 'Kem') c
                CROSS JOIN (SELECT '35' as size UNION SELECT '36' UNION SELECT '37' UNION SELECT '38' UNION SELECT '39') s;
            END IF;
        END IF;

    END LOOP;

    CLOSE cur;
END //

DELIMITER ;

-- Thực thi thủ tục
CALL InsertProductVariants();

-- Xóa thủ tục sau khi dùng xong
DROP PROCEDURE IF EXISTS InsertProductVariants;
