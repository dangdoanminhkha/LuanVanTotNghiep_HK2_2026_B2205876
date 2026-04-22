# =====================================
# BACKEND: INVENTORY ROUTES (Python - Flask)
# File: routes/inventory.py
# =====================================

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import mysql.connector
from datetime import datetime
from decimal import Decimal

bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

# Database connection helper
def get_db():
    """Get database connection"""
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='',  # Update with your MySQL password
        database='shoe_store'
    )

# =====================================
# 1. GET /api/inventory/stock
# Lấy số lượng tồn kho hiện tại
# =====================================
@bp.route('/stock', methods=['GET'])
@cross_origin()
def get_current_stock():
    """
    Trả về JSON map tồn kho của tất cả variants:
    {
      "101": 50,    # variant_id: current_quantity
      "102": 30,
      ...
    }
    """
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # SQL: Sum all quantity changes by variant_id
        query = """
            SELECT 
                variant_id,
                SUM(quantity_changed) as current_stock
            FROM inventory_logs
            GROUP BY variant_id
            ORDER BY variant_id ASC
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Convert to dictionary: {variant_id: current_stock}
        stock_map = {str(row['variant_id']): row['current_stock'] for row in results}
        
        cursor.close()
        db.close()
        
        return jsonify(stock_map), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================
# 2. GET /api/inventory/logs
# Lấy lịch sử sổ cái (có JOIN)
# =====================================
@bp.route('/logs', methods=['GET'])
@cross_origin()
def get_inventory_logs():
    """
    Trả về chi tiết các giao dịch kèm thông tin sản phẩm:
    [
      {
        "id": 1,
        "created_at": "2026-04-03 10:30:00",
        "reference_code": "PN-10234",
        "product_name": "Nike Air Max 90",
        "variant_name": "Size 40 - Đen",
        "action_type": "IMPORT",
        "quantity_changed": 50,
        "import_price": 500000,
        "note": "Nhập tết 2026"
      },
      ...
    ]
    """
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # SQL: JOIN với products và product_variants
        query = """
            SELECT 
                il.id,
                il.created_at,
                il.reference_code,
                il.variant_id,
                il.quantity_changed,
                il.import_price,
                il.action_type,
                il.note,
                p.name as product_name,
                pv.size,
                pv.color,
                c.color as color_name,
                c.hex_code
            FROM inventory_logs il
            JOIN product_variants pv ON il.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN colors c ON pv.color_id = c.id
            ORDER BY il.created_at DESC
            LIMIT 100
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Format response
        logs = []
        for row in results:
            # Create variant_name from size and color
            if row['color_id']:
                variant_name = f"Size {row['size']} - {row['color_name']}"
            else:
                variant_name = f"Size {row['size']} - {row['color']}"
            
            logs.append({
                'id': row['id'],
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'reference_code': row['reference_code'],
                'product_name': row['product_name'],
                'variant_name': variant_name,
                'variant_id': row['variant_id'],
                'action_type': row['action_type'],
                'quantity_changed': row['quantity_changed'],
                'import_price': float(row['import_price']) if row['import_price'] else None,
                'note': row['note']
            })
        
        cursor.close()
        db.close()
        
        return jsonify(logs), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================
# 3. POST /api/inventory/import
# Xử lý form Nhập hàng (Transaction)
# =====================================
@bp.route('/import', methods=['POST'])
@cross_origin()
def create_import():
    """
    Nhập hàng từ form.
    
    Payload:
    {
      "reference_code": "PN-10234",
      "note": "Nhập tết 2026",
      "items": [
        {"variant_id": 101, "qty": 50, "price": 500000},
        {"variant_id": 102, "qty": 30, "price": 520000},
        ...
      ]
    }
    
    Logic:
    - Validate reference_code (phải unique)
    - Duyệt qua items, insert vào inventory_logs
    - Sử dụng Transaction (Commit nếu OK, Rollback nếu error)
    """
    try:
        data = request.json
        
        # Validate input
        if not data or 'reference_code' not in data or 'items' not in data:
            return jsonify({'error': 'Missing required fields: reference_code, items'}), 400
        
        reference_code = data.get('reference_code')
        note = data.get('note', '')
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'Items list cannot be empty'}), 400
        
        # Validate items
        for item in items:
            if 'variant_id' not in item or 'qty' not in item or 'price' not in item:
                return jsonify({'error': 'Each item must have variant_id, qty, price'}), 400
            
            if item['qty'] <= 0:
                return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        # Connect to DB
        db = get_db()
        cursor = db.cursor()
        
        try:
            # Start transaction
            db.start_transaction()
            
            # Check if reference_code already exists
            check_query = "SELECT id FROM inventory_logs WHERE reference_code = %s LIMIT 1"
            cursor.execute(check_query, (reference_code,))
            if cursor.fetchone():
                db.rollback()
                return jsonify({'error': f'Reference code {reference_code} already exists'}), 400
            
            # Insert each item into inventory_logs
            insert_query = """
                INSERT INTO inventory_logs 
                (variant_id, quantity_changed, import_price, action_type, reference_code, note, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            for item in items:
                variant_id = item['variant_id']
                qty = int(item['qty'])
                price = float(item['price'])
                
                cursor.execute(insert_query, (
                    variant_id,
                    qty,  # Positive for import
                    price,
                    'IMPORT',
                    reference_code,
                    note,
                    datetime.now()
                ))
            
            # Commit transaction
            db.commit()
            
            return jsonify({
                'message': f'Import successful! Reference: {reference_code}',
                'reference_code': reference_code,
                'items_count': len(items)
            }), 201
        
        except Exception as e:
            # Rollback on error
            db.rollback()
            raise e
        
        finally:
            cursor.close()
            db.close()
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================
# BONUS: POST /api/inventory/adjust
# Chỉnh sửa tồn kho thủ công (Inventory Adjustment)
# =====================================
@bp.route('/adjust', methods=['POST'])
@cross_origin()
def adjust_stock():
    """
    Chỉnh sửa tồn kho thủ công.
    
    Payload:
    {
      "variant_id": 101,
      "quantity_change": 5,  # Có thể dương hoặc âm
      "reason": "Kiểm kê",
      "reference_code": "ADJ-001"
    }
    """
    try:
        data = request.json
        
        if not data or 'variant_id' not in data or 'quantity_change' not in data:
            return jsonify({'error': 'Missing variant_id or quantity_change'}), 400
        
        variant_id = data.get('variant_id')
        quantity_change = int(data.get('quantity_change'))
        reason = data.get('reason', 'Manual Adjustment')
        reference_code = data.get('reference_code', f'ADJ-{datetime.now().timestamp()}')
        
        db = get_db()
        cursor = db.cursor()
        
        try:
            insert_query = """
                INSERT INTO inventory_logs 
                (variant_id, quantity_changed, import_price, action_type, reference_code, note, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(insert_query, (
                variant_id,
                quantity_change,
                None,  # No import price for adjustment
                'ADJUST',
                reference_code,
                reason,
                datetime.now()
            ))
            
            db.commit()
            
            return jsonify({
                'message': 'Adjustment recorded',
                'reference_code': reference_code
            }), 201
        
        except Exception as e:
            db.rollback()
            raise e
        
        finally:
            cursor.close()
            db.close()
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================
# INTEGRATION IN MAIN APP (app.py)
# =====================================
# from routes.inventory import bp as inventory_bp
# app.register_blueprint(inventory_bp)
