#!/bin/bash

echo "================================"
echo "Khởi tạo database shoestore"
echo "================================"
echo ""

# Kiểm tra MySQL có được cài đặt không
if ! command -v mysql &> /dev/null; then
    echo "[ERROR] MySQL chưa được cài đặt hoặc chưa thêm vào PATH"
    echo "Vui lòng cài đặt MySQL và thêm vào biến môi trường PATH"
    exit 1
fi

echo "[1/3] Đang tạo database và schema..."
mysql -u root -p < schema.sql
if [ $? -ne 0 ]; then
    echo "[ERROR] Không thể tạo database. Vui lòng kiểm tra mật khẩu MySQL"
    exit 1
fi

echo "[2/3] Đang thêm dữ liệu mẫu..."
mysql -u root -p < seed.sql
if [ $? -ne 0 ]; then
    echo "[ERROR] Không thể thêm dữ liệu mẫu"
    exit 1
fi

echo "[3/3] Hoàn tất!"
echo ""
echo "================================"
echo "Database đã được khởi tạo thành công!"
echo "================================"
echo ""
echo "Thông tin đăng nhập mặc định:"
echo "- Admin: username=admin, password=admin123"
echo "- Shipper: username=shipper1, password=admin123"
echo "- Customer: username=customer1, password=admin123"
echo ""
echo "Lưu ý: Cần hash lại password bằng bcrypt trước khi sử dụng!"
echo ""
