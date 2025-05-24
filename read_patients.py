import sqlite3

DB_PATH = 'database.sqlite'

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    cursor.execute("SELECT code, startDate, active, isAdmin, language FROM patients")
    patients = cursor.fetchall()
    print(f"{'Code':<15} {'StartDate':<25} {'Active':<7} {'isAdmin':<7} {'Langue':<7}")
    print('-' * 65)
    for code, startDate, active, isAdmin, language in patients:
        print(f"{code:<15} {startDate:<25} {active:<7} {isAdmin:<7} {language:<7}")
finally:
    conn.close() 