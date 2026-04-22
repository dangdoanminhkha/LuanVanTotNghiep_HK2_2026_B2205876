USE shoestore;

ALTER TABLE orders DROP COLUMN shipping_address;
ALTER TABLE orders DROP COLUMN phone;
ALTER TABLE orders DROP COLUMN recipient_name;
ALTER TABLE orders DROP COLUMN recipient_phone;
ALTER TABLE orders DROP COLUMN province_name;
ALTER TABLE orders DROP COLUMN district_name;
ALTER TABLE orders DROP COLUMN ward_name;
ALTER TABLE orders DROP COLUMN province;
ALTER TABLE orders DROP COLUMN district;
ALTER TABLE orders DROP COLUMN ward;
ALTER TABLE orders DROP COLUMN address_detail;

ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_user_address_id 
  FOREIGN KEY (user_address_id) 
  REFERENCES user_addresses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_address_id ON orders(user_address_id);
