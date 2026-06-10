import mysql.connector
import sys

print("Testing connection with Python...")
try:
    conn = mysql.connector.connect(
        host="bsyfwkfz5d6scbiu2ue8-mysql.services.clever-cloud.com",
        user="uqpbzumyuo5nhmvw",
        password="3f8GkeQfYhNtDuql63eU",
        database="bsyfwkfz5d6scbiu2ue8",
        port=3306
    )
    print("✅ Connection SUCCESS with Python!")
    conn.close()
except Exception as e:
    print("❌ Connection FAILED with Python:", e)
    sys.exit(1)
