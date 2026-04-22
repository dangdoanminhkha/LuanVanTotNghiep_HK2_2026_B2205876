SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE shoestore;

-- Xóa dữ liệu cũ
DELETE FROM product_variants;

-- ============ GIAY THE THAO NAM ============
-- Product 1: Giay The Thao Nam MWC 5811 - Nam
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 12 FROM products WHERE sku='MWC-5811' UNION ALL
SELECT id, '40', 'Den', 15 FROM products WHERE sku='MWC-5811' UNION ALL
SELECT id, '41', 'Den', 10 FROM products WHERE sku='MWC-5811' UNION ALL
SELECT id, '39', 'Kem', 8 FROM products WHERE sku='MWC-5811' UNION ALL
SELECT id, '40', 'Kem', 5 FROM products WHERE sku='MWC-5811';

-- Product 2: Giay The Thao Nam MWC 5886
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 10 FROM products WHERE sku='MWC-5886' UNION ALL
SELECT id, '40', 'Den', 12 FROM products WHERE sku='MWC-5886' UNION ALL
SELECT id, '41', 'Den', 8 FROM products WHERE sku='MWC-5886' UNION ALL
SELECT id, '39', 'Xam', 7 FROM products WHERE sku='MWC-5886' UNION ALL
SELECT id, '40', 'Xam', 8 FROM products WHERE sku='MWC-5886';

-- Product 3: Giay Tay Nam MWC 6745
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 8 FROM products WHERE sku='MWC-6745' UNION ALL
SELECT id, '40', 'Den', 10 FROM products WHERE sku='MWC-6745' UNION ALL
SELECT id, '41', 'Den', 12 FROM products WHERE sku='MWC-6745';

-- Product 4: Giay Tay Nam MWC 6729
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '40', 'Den', 8 FROM products WHERE sku='MWC-6729' UNION ALL
SELECT id, '41', 'Den', 10 FROM products WHERE sku='MWC-6729' UNION ALL
SELECT id, '42', 'Den', 10 FROM products WHERE sku='MWC-6729';

-- Product 5: Giay Sneaker Nam Nike
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den-Trang', 12 FROM products WHERE sku='NIKE-M001' UNION ALL
SELECT id, '40', 'Den-Trang', 10 FROM products WHERE sku='NIKE-M001' UNION ALL
SELECT id, '41', 'Den-Trang', 8 FROM products WHERE sku='NIKE-M001' UNION ALL
SELECT id, '39', 'Trang', 10 FROM products WHERE sku='NIKE-M001';

-- Product 6: Giay The Thao Nam Adidas
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 12 FROM products WHERE sku='ADIDAS-M001' UNION ALL
SELECT id, '40', 'Den', 10 FROM products WHERE sku='ADIDAS-M001' UNION ALL
SELECT id, '41', 'Den', 13 FROM products WHERE sku='ADIDAS-M001';

-- Product 7: Giay Chay Bo Nam Asics
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '40', 'Den', 8 FROM products WHERE sku='ASICS-M001' UNION ALL
SELECT id, '41', 'Den', 10 FROM products WHERE sku='ASICS-M001' UNION ALL
SELECT id, '42', 'Den', 7 FROM products WHERE sku='ASICS-M001';

-- Product 8: Giay The Thao Nam Puma
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 10 FROM products WHERE sku='PUMA-M001' UNION ALL
SELECT id, '40', 'Den', 12 FROM products WHERE sku='PUMA-M001' UNION ALL
SELECT id, '41', 'Den', 10 FROM products WHERE sku='PUMA-M001';

-- Product 9: Giay Canvas Nam Casual
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '38', 'Trang', 15 FROM products WHERE sku='CANVAS-M001' UNION ALL
SELECT id, '39', 'Trang', 20 FROM products WHERE sku='CANVAS-M001' UNION ALL
SELECT id, '40', 'Trang', 20 FROM products WHERE sku='CANVAS-M001';

-- Product 10: Giay Oxford Nam Formal
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '40', 'Den', 5 FROM products WHERE sku='OXFORD-M001' UNION ALL
SELECT id, '41', 'Den', 8 FROM products WHERE sku='OXFORD-M001' UNION ALL
SELECT id, '42', 'Den', 7 FROM products WHERE sku='OXFORD-M001';

-- ============ DEP NAM ============
-- Product 11-20: Dep Nam - chinh la size S/M/L va 1-2 color
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 20 FROM products WHERE sku='MWC-9262' UNION ALL
SELECT id, 'L', 'Den', 20 FROM products WHERE sku='MWC-9262' UNION ALL
SELECT id, 'M', 'Kem', 20 FROM products WHERE sku='MWC-9262' UNION ALL
SELECT id, 'L', 'Kem', 20 FROM products WHERE sku='MWC-9262';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 15 FROM products WHERE sku='MWC-9253' UNION ALL
SELECT id, 'L', 'Den', 15 FROM products WHERE sku='MWC-9253' UNION ALL
SELECT id, 'M', 'Nau', 10 FROM products WHERE sku='MWC-9253' UNION ALL
SELECT id, 'L', 'Nau', 10 FROM products WHERE sku='MWC-9253';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Xanh', 25 FROM products WHERE sku='FLIPFLOP-M001' UNION ALL
SELECT id, 'L', 'Xanh', 25 FROM products WHERE sku='FLIPFLOP-M001' UNION ALL
SELECT id, 'M', 'Do', 15 FROM products WHERE sku='FLIPFLOP-M001' UNION ALL
SELECT id, 'L', 'Do', 15 FROM products WHERE sku='FLIPFLOP-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 15 FROM products WHERE sku='SPORT-M001' UNION ALL
SELECT id, 'L', 'Den', 15 FROM products WHERE sku='SPORT-M001' UNION ALL
SELECT id, 'M', 'Xam', 8 FROM products WHERE sku='SPORT-M001' UNION ALL
SELECT id, 'L', 'Xam', 7 FROM products WHERE sku='SPORT-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Xanh', 25 FROM products WHERE sku='AQUA-M001' UNION ALL
SELECT id, 'L', 'Xanh', 25 FROM products WHERE sku='AQUA-M001' UNION ALL
SELECT id, 'M', 'Cam', 10 FROM products WHERE sku='AQUA-M001' UNION ALL
SELECT id, 'L', 'Cam', 10 FROM products WHERE sku='AQUA-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 8 FROM products WHERE sku='ORTHO-M001' UNION ALL
SELECT id, 'L', 'Den', 9 FROM products WHERE sku='ORTHO-M001' UNION ALL
SELECT id, 'M', 'Xanh', 4 FROM products WHERE sku='ORTHO-M001' UNION ALL
SELECT id, 'L', 'Xanh', 4 FROM products WHERE sku='ORTHO-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 12 FROM products WHERE sku='PREMIUM-M001' UNION ALL
SELECT id, 'L', 'Den', 12 FROM products WHERE sku='PREMIUM-M001' UNION ALL
SELECT id, 'M', 'Trang', 5 FROM products WHERE sku='PREMIUM-M001' UNION ALL
SELECT id, 'L', 'Trang', 6 FROM products WHERE sku='PREMIUM-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 18 FROM products WHERE sku='CASUAL-M001' UNION ALL
SELECT id, 'L', 'Den', 18 FROM products WHERE sku='CASUAL-M001' UNION ALL
SELECT id, 'M', 'Trang', 10 FROM products WHERE sku='CASUAL-M001' UNION ALL
SELECT id, 'L', 'Trang', 9 FROM products WHERE sku='CASUAL-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Den', 10 FROM products WHERE sku='CORK-M001' UNION ALL
SELECT id, 'L', 'Den', 10 FROM products WHERE sku='CORK-M001' UNION ALL
SELECT id, 'M', 'Nau', 5 FROM products WHERE sku='CORK-M001' UNION ALL
SELECT id, 'L', 'Nau', 5 FROM products WHERE sku='CORK-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'M', 'Xanh', 22 FROM products WHERE sku='COMFY-M001' UNION ALL
SELECT id, 'L', 'Xanh', 22 FROM products WHERE sku='COMFY-M001' UNION ALL
SELECT id, 'M', 'Xam', 11 FROM products WHERE sku='COMFY-M001' UNION ALL
SELECT id, 'L', 'Xam', 10 FROM products WHERE sku='COMFY-M001';

-- ============ SANDAL NAM ============
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 12 FROM products WHERE sku='MWC-7103' UNION ALL
SELECT id, '40', 'Den', 14 FROM products WHERE sku='MWC-7103' UNION ALL
SELECT id, '41', 'Den', 14 FROM products WHERE sku='MWC-7103';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 12 FROM products WHERE sku='MWC-7106' UNION ALL
SELECT id, '40', 'Den', 12 FROM products WHERE sku='MWC-7106' UNION ALL
SELECT id, '41', 'Den', 14 FROM products WHERE sku='MWC-7106';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 8 FROM products WHERE sku='TREK-M001' UNION ALL
SELECT id, '40', 'Den', 8 FROM products WHERE sku='TREK-M001' UNION ALL
SELECT id, '41', 'Den', 6 FROM products WHERE sku='TREK-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '40', 'Xam', 10 FROM products WHERE sku='ADV-M001' UNION ALL
SELECT id, '41', 'Xam', 10 FROM products WHERE sku='ADV-M001' UNION ALL
SELECT id, '42', 'Xam', 8 FROM products WHERE sku='ADV-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Nau', 12 FROM products WHERE sku='LEATHER-M001' UNION ALL
SELECT id, '40', 'Nau', 10 FROM products WHERE sku='LEATHER-M001' UNION ALL
SELECT id, '41', 'Nau', 10 FROM products WHERE sku='LEATHER-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Den', 15 FROM products WHERE sku='CAUSAL-SD-M001' UNION ALL
SELECT id, '40', 'Den', 18 FROM products WHERE sku='CAUSAL-SD-M001' UNION ALL
SELECT id, '41', 'Den', 17 FROM products WHERE sku='CAUSAL-SD-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Kem', 10 FROM products WHERE sku='COMFORT-SD-M001' UNION ALL
SELECT id, '40', 'Kem', 12 FROM products WHERE sku='COMFORT-SD-M001' UNION ALL
SELECT id, '41', 'Kem', 13 FROM products WHERE sku='COMFORT-SD-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '39', 'Trang', 20 FROM products WHERE sku='BEACH-M001' UNION ALL
SELECT id, '40', 'Trang', 20 FROM products WHERE sku='BEACH-M001' UNION ALL
SELECT id, '41', 'Trang', 20 FROM products WHERE sku='BEACH-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '40', 'Den', 8 FROM products WHERE sku='SMART-SD-M001' UNION ALL
SELECT id, '41', 'Den', 10 FROM products WHERE sku='SMART-SD-M001' UNION ALL
SELECT id, '42', 'Den', 7 FROM products WHERE sku='SMART-SD-M001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '40', 'Nau', 8 FROM products WHERE sku='PREMIUM-SD-M001' UNION ALL
SELECT id, '41', 'Nau', 6 FROM products WHERE sku='PREMIUM-SD-M001' UNION ALL
SELECT id, '42', 'Nau', 6 FROM products WHERE sku='PREMIUM-SD-M001';

-- ============ GIAY CAO GOT NU ============
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Den', 10 FROM products WHERE sku='MWC-G268' UNION ALL
SELECT id, '37', 'Den', 15 FROM products WHERE sku='MWC-G268' UNION ALL
SELECT id, '38', 'Den', 15 FROM products WHERE sku='MWC-G268' UNION ALL
SELECT id, '36', 'Kem', 8 FROM products WHERE sku='MWC-G268' UNION ALL
SELECT id, '37', 'Kem', 2 FROM products WHERE sku='MWC-G268';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Bac', 12 FROM products WHERE sku='MWC-G317' UNION ALL
SELECT id, '36', 'Bac', 12 FROM products WHERE sku='MWC-G317' UNION ALL
SELECT id, '37', 'Bac', 11 FROM products WHERE sku='MWC-G317' UNION ALL
SELECT id, '36', 'Den', 8 FROM products WHERE sku='MWC-G317' UNION ALL
SELECT id, '37', 'Den', -2 FROM products WHERE sku='MWC-G317';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Bac', 8 FROM products WHERE sku='MWC-G345' UNION ALL
SELECT id, '36', 'Bac', 12 FROM products WHERE sku='MWC-G345' UNION ALL
SELECT id, '37', 'Bac', 12 FROM products WHERE sku='MWC-G345';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Kem', 15 FROM products WHERE sku='MWC-G322' UNION ALL
SELECT id, '37', 'Kem', 15 FROM products WHERE sku='MWC-G322' UNION ALL
SELECT id, '38', 'Kem', 15 FROM products WHERE sku='MWC-G322' UNION ALL
SELECT id, '36', 'Den', 8 FROM products WHERE sku='MWC-G322' UNION ALL
SELECT id, '37', 'Den', 7 FROM products WHERE sku='MWC-G322';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Trang', 10 FROM products WHERE sku='MWC-G347' UNION ALL
SELECT id, '37', 'Trang', 8 FROM products WHERE sku='MWC-G347' UNION ALL
SELECT id, '38', 'Trang', 10 FROM products WHERE sku='MWC-G347';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Kem', 10 FROM products WHERE sku='MWC-G296' UNION ALL
SELECT id, '36', 'Kem', 12 FROM products WHERE sku='MWC-G296' UNION ALL
SELECT id, '37', 'Kem', 11 FROM products WHERE sku='MWC-G296';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Den', 8 FROM products WHERE sku='PREMIUM-CG-001' UNION ALL
SELECT id, '36', 'Den', 6 FROM products WHERE sku='PREMIUM-CG-001' UNION ALL
SELECT id, '37', 'Den', 6 FROM products WHERE sku='PREMIUM-CG-001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Den', 9 FROM products WHERE sku='CLASSIC-CG-001' UNION ALL
SELECT id, '37', 'Den', 8 FROM products WHERE sku='CLASSIC-CG-001' UNION ALL
SELECT id, '38', 'Den', 8 FROM products WHERE sku='CLASSIC-CG-001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Trang', 12 FROM products WHERE sku='HANOI-CG-001' UNION ALL
SELECT id, '37', 'Trang', 9 FROM products WHERE sku='HANOI-CG-001' UNION ALL
SELECT id, '38', 'Trang', 9 FROM products WHERE sku='HANOI-CG-001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Den', 8 FROM products WHERE sku='TSTRAP-CG-001' UNION ALL
SELECT id, '37', 'Den', 7 FROM products WHERE sku='TSTRAP-CG-001' UNION ALL
SELECT id, '38', 'Den', 7 FROM products WHERE sku='TSTRAP-CG-001';

-- ============ GIAY THE THAO NU ============
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Trang-Den', 18 FROM products WHERE sku='MWC-A397' UNION ALL
SELECT id, '36', 'Trang-Den', 16 FROM products WHERE sku='MWC-A397' UNION ALL
SELECT id, '37', 'Trang-Den', 16 FROM products WHERE sku='MWC-A397' UNION ALL
SELECT id, '35', 'Kem-Den', 8 FROM products WHERE sku='MWC-A397' UNION ALL
SELECT id, '36', 'Kem-Den', 2 FROM products WHERE sku='MWC-A397';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Trang', 15 FROM products WHERE sku='NIKE-F001' UNION ALL
SELECT id, '37', 'Trang', 10 FROM products WHERE sku='NIKE-F001' UNION ALL
SELECT id, '38', 'Trang', 10 FROM products WHERE sku='NIKE-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Den-Trang', 15 FROM products WHERE sku='ADIDAS-F001' UNION ALL
SELECT id, '37', 'Den-Trang', 12 FROM products WHERE sku='ADIDAS-F001' UNION ALL
SELECT id, '38', 'Den-Trang', 13 FROM products WHERE sku='ADIDAS-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Xam', 22 FROM products WHERE sku='CASUAL-F001' UNION ALL
SELECT id, '36', 'Xam', 20 FROM products WHERE sku='CASUAL-F001' UNION ALL
SELECT id, '37', 'Xam', 18 FROM products WHERE sku='CASUAL-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Do', 10 FROM products WHERE sku='BBALL-F001' UNION ALL
SELECT id, '37', 'Do', 8 FROM products WHERE sku='BBALL-F001' UNION ALL
SELECT id, '38', 'Do', 7 FROM products WHERE sku='BBALL-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Trang', 11 FROM products WHERE sku='TENNIS-F001' UNION ALL
SELECT id, '37', 'Trang', 10 FROM products WHERE sku='TENNIS-F001' UNION ALL
SELECT id, '38', 'Trang', 9 FROM products WHERE sku='TENNIS-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '35', 'Tim', 20 FROM products WHERE sku='YOGA-F001' UNION ALL
SELECT id, '36', 'Tim', 18 FROM products WHERE sku='YOGA-F001' UNION ALL
SELECT id, '37', 'Tim', 17 FROM products WHERE sku='YOGA-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Den', 15 FROM products WHERE sku='PUMA-F001' UNION ALL
SELECT id, '37', 'Den', 15 FROM products WHERE sku='PUMA-F001' UNION ALL
SELECT id, '38', 'Den', 15 FROM products WHERE sku='PUMA-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Trang', 10 FROM products WHERE sku='ASICS-F001' UNION ALL
SELECT id, '37', 'Trang', 9 FROM products WHERE sku='ASICS-F001' UNION ALL
SELECT id, '38', 'Trang', 9 FROM products WHERE sku='ASICS-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, '36', 'Den', 12 FROM products WHERE sku='NB-F001' UNION ALL
SELECT id, '37', 'Den', 10 FROM products WHERE sku='NB-F001' UNION ALL
SELECT id, '38', 'Den', 10 FROM products WHERE sku='NB-F001';

-- ============ SANDAL NU ============
INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Den', 25 FROM products WHERE sku='MWC-8683' UNION ALL
SELECT id, 'M', 'Den', 24 FROM products WHERE sku='MWC-8683' UNION ALL
SELECT id, 'L', 'Den', 21 FROM products WHERE sku='MWC-8683' UNION ALL
SELECT id, 'S', 'Kem', 15 FROM products WHERE sku='MWC-8683' UNION ALL
SELECT id, 'M', 'Kem', 15 FROM products WHERE sku='MWC-8683';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Kem', 28 FROM products WHERE sku='MWC-8673' UNION ALL
SELECT id, 'M', 'Kem', 26 FROM products WHERE sku='MWC-8673' UNION ALL
SELECT id, 'L', 'Kem', 26 FROM products WHERE sku='MWC-8673' UNION ALL
SELECT id, 'S', 'Den', 15 FROM products WHERE sku='MWC-8673' UNION ALL
SELECT id, 'M', 'Den', 15 FROM products WHERE sku='MWC-8673';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Kem', 20 FROM products WHERE sku='MWC-8687' UNION ALL
SELECT id, 'M', 'Kem', 18 FROM products WHERE sku='MWC-8687' UNION ALL
SELECT id, 'L', 'Kem', 17 FROM products WHERE sku='MWC-8687';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Den', 15 FROM products WHERE sku='MWC-E208' UNION ALL
SELECT id, 'M', 'Den', 15 FROM products WHERE sku='MWC-E208' UNION ALL
SELECT id, 'L', 'Den', 15 FROM products WHERE sku='MWC-E208' UNION ALL
SELECT id, 'S', 'Kem', 10 FROM products WHERE sku='MWC-E208' UNION ALL
SELECT id, 'M', 'Kem', 5 FROM products WHERE sku='MWC-E208';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Kem', 15 FROM products WHERE sku='MWC-E215' UNION ALL
SELECT id, 'M', 'Kem', 10 FROM products WHERE sku='MWC-E215' UNION ALL
SELECT id, 'L', 'Kem', 10 FROM products WHERE sku='MWC-E215';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Xanh', 30 FROM products WHERE sku='SUMMER-F001' UNION ALL
SELECT id, 'M', 'Xanh', 30 FROM products WHERE sku='SUMMER-F001' UNION ALL
SELECT id, 'L', 'Xanh', 30 FROM products WHERE sku='SUMMER-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Trang', 20 FROM products WHERE sku='CASUAL-FD-001' UNION ALL
SELECT id, 'M', 'Trang', 23 FROM products WHERE sku='CASUAL-FD-001' UNION ALL
SELECT id, 'L', 'Trang', 22 FROM products WHERE sku='CASUAL-FD-001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Den', 13 FROM products WHERE sku='OUTDOOR-F001' UNION ALL
SELECT id, 'M', 'Den', 14 FROM products WHERE sku='OUTDOOR-F001' UNION ALL
SELECT id, 'L', 'Den', 13 FROM products WHERE sku='OUTDOOR-F001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Nau', 12 FROM products WHERE sku='LEATHER-FD-001' UNION ALL
SELECT id, 'M', 'Nau', 10 FROM products WHERE sku='LEATHER-FD-001' UNION ALL
SELECT id, 'L', 'Nau', 8 FROM products WHERE sku='LEATHER-FD-001';

INSERT INTO product_variants (product_id, size, color, stock) 
SELECT id, 'S', 'Xam', 18 FROM products WHERE sku='COMFORT-FD-001' UNION ALL
SELECT id, 'M', 'Xam', 18 FROM products WHERE sku='COMFORT-FD-001' UNION ALL
SELECT id, 'L', 'Xam', 14 FROM products WHERE sku='COMFORT-FD-001';

-- Cap nhat sold field (gia tri ngau nhien)
UPDATE products SET sold = FLOOR(RAND() * quantity * 0.3) WHERE id > 0;

-- Xac nhan insert
SELECT COUNT(*) as total_variants FROM product_variants;
SELECT product_id, COUNT(DISTINCT size) as sizes, COUNT(DISTINCT color) as colors FROM product_variants GROUP BY product_id LIMIT 10;
SELECT category, COUNT(DISTINCT product_id) as products, COUNT(*) as variants FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id GROUP BY p.category;
