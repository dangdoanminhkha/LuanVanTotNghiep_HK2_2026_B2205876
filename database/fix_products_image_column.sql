-- Fix products.image column type
-- The column should be VARCHAR for a single image URL, not JSON
-- This handles the case where JSON-type column has invalid JSON data stored

-- Step 1: Create a temporary column to store the existing data
ALTER TABLE products ADD COLUMN image_temp VARCHAR(500);

-- Step 2: Copy data from image column to temporary column
-- Handle both valid JSON strings and plain URLs
UPDATE products SET image_temp = CASE
    WHEN image IS NULL THEN NULL
    WHEN image = '' THEN ''
    WHEN image LIKE '["%' THEN JSON_UNQUOTE(JSON_EXTRACT(image, '$[0]'))
    ELSE image
END;

-- Step 3: Drop the old problematic image column
ALTER TABLE products DROP COLUMN image;

-- Step 4: Rename the temporary column to image
ALTER TABLE products CHANGE COLUMN image_temp image VARCHAR(500);

-- Step 5: Verify the change
SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'image';
