-- =====================================================================
-- FINAL STEP: Drop old columns
-- =====================================================================
-- ⚠️ CHẠY CÂU NÀY CHỈ TIẾP NHƯ BẠN ĐÃ CHẮC CHẮN HẾT:
-- 1. ✅ Migration thành công (657/657 rows filled)
-- 2. ✅ Update hết API backend để dùng color_id, size_id
-- 3. ✅ Test ứng dụng hoạt động bình thường

USE shoestore;

-- Backup (chỉ check cú pháp)
-- SELECT * INTO OUTFILE '/tmp/product_variants_backup.sql' FROM product_variants;

-- XÓA COLUMNS CŨ
ALTER TABLE product_variants 
DROP COLUMN color,
DROP COLUMN size;

-- Kiểm tra
DESCRIBE product_variants;

SELECT 'Old columns removed successfully!' as status;
