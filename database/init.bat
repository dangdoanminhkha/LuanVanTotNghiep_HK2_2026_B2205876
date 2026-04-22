@echo off
echo ================================
echo Khoi tao database shoestore
echo ================================
echo.

REM Kiem tra MySQL co duoc cai dat khong
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL chua duoc cai dat hoac chua them vao PATH
    echo Vui long cai dat MySQL va them vao bien moi truong PATH
    pause
    exit /b 1
)

echo [1/3] Dang tao database va schema...
mysql -u root -p < schema.sql
if %errorlevel% neq 0 (
    echo [ERROR] Khong the tao database. Vui long kiem tra mat khau MySQL
    pause
    exit /b 1
)

echo [2/3] Dang them du lieu mau...
mysql -u root -p < seed.sql
if %errorlevel% neq 0 (
    echo [ERROR] Khong the them du lieu mau
    pause
    exit /b 1
)

echo [3/3] Hoan tat!
echo.
echo ================================
echo Database da duoc khoi tao thanh cong!
echo ================================
echo.
echo Thong tin dang nhap mac dinh:
echo - Admin: username=admin, password=admin123
echo - Shipper: username=shipper1, password=admin123
echo - Customer: username=customer1, password=admin123
echo.
echo Luu y: Can hash lai password bang bcrypt truoc khi su dung!
echo.
pause
