import sqlite3

conn = sqlite3.connect("voyago.db")
cursor = conn.cursor()

# First show table structure
cursor.execute("PRAGMA table_info(users)")
cols = cursor.fetchall()
print("\n--- COLUMNS IN users TABLE ---")
for col in cols:
    print(f"  {col[1]} ({col[2]})")

# Then show all data
col_names = [col[1] for col in cols]
cursor.execute("SELECT * FROM users")
rows = cursor.fetchall()

print(f"\n--- ALL USERS ({len(rows)} total) ---")
for row in rows:
    print()
    for name, val in zip(col_names, row):
        print(f"  {name}: {val}")

conn.close()
