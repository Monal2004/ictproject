import pymysql
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env')
conn = pymysql.connect(
    host=os.getenv('DB_HOST','127.0.0.1'),
    port=int(os.getenv('DB_PORT','3306')),
    user=os.getenv('DB_USER','civicvoice'),
    password=os.getenv('DB_PASSWORD',''),
    database=os.getenv('DB_NAME','civicvoice'),
    charset='utf8mb4'
)
cur = conn.cursor()
with open('schema.sql','r',encoding='utf-8') as f:
    sql = f.read()
for s in sql.split(';'):
    s = s.strip()
    if s and not s.startswith('--'):
        cur.execute(s)
conn.commit()
conn.close()
print('ok')
