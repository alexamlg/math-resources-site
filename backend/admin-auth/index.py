'''
Business: Двухфакторная авторизация администратора с кодом на email
Args: event с httpMethod, body (username, password, code)
      context с request_id
Returns: JWT токен при успешной авторизации или подтверждение отправки кода
'''
import json
import os
import psycopg2
import bcrypt
import jwt
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, Any

SECRET_KEY = os.environ.get('ADMIN_JWT_SECRET', 'admin-secret-key-change-in-production')
ADMIN_EMAIL = 'pauzhetka@yandex.ru'

def send_email_code(code: str):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Код входа в админ-панель'
    msg['From'] = smtp_user
    msg['To'] = ADMIN_EMAIL
    
    html = f'''
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Код для входа в админ-панель</h2>
        <p style="font-size: 16px;">Ваш код для входа:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4F46E5; font-size: 36px; margin: 0; letter-spacing: 8px;">{code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">Код действителен в течение 5 минут.</p>
        <p style="color: #666; font-size: 14px;">Если вы не запрашивали код, просто проигнорируйте это письмо.</p>
      </body>
    </html>
    '''
    
    part = MIMEText(html, 'html')
    msg.attach(part)
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    username = body_data.get('username')
    password = body_data.get('password')
    code = body_data.get('code')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if not code:
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Username and password required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                'SELECT id, password_hash FROM t_p99209851_math_resources_site.admin_users WHERE username = %s',
                (username,)
            )
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            admin_id, password_hash = row
            
            if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            expires_at = datetime.utcnow() + timedelta(minutes=5)
            
            cur.execute(
                '''INSERT INTO t_p99209851_math_resources_site.admin_2fa_codes 
                   (admin_email, code, expires_at) 
                   VALUES (%s, %s, %s)''',
                (ADMIN_EMAIL, verification_code, expires_at)
            )
            conn.commit()
            
            send_email_code(verification_code)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'step': 'code_sent',
                    'message': 'Код отправлен на email',
                    'email_hint': ADMIN_EMAIL[:3] + '***@' + ADMIN_EMAIL.split('@')[1]
                }),
                'isBase64Encoded': False
            }
        
        else:
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Username and password required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                'SELECT id FROM t_p99209851_math_resources_site.admin_users WHERE username = %s',
                (username,)
            )
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            admin_id = row[0]
            
            cur.execute(
                '''SELECT id FROM t_p99209851_math_resources_site.admin_2fa_codes 
                   WHERE admin_email = %s AND code = %s AND expires_at > NOW() AND is_used = FALSE
                   ORDER BY created_at DESC LIMIT 1''',
                (ADMIN_EMAIL, code)
            )
            code_row = cur.fetchone()
            
            if not code_row:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный или истёкший код'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                'UPDATE t_p99209851_math_resources_site.admin_2fa_codes SET is_used = TRUE WHERE id = %s',
                (code_row[0],)
            )
            conn.commit()
            
            token = jwt.encode(
                {
                    'admin_id': admin_id,
                    'username': username,
                    'exp': datetime.utcnow() + timedelta(days=7)
                },
                SECRET_KEY,
                algorithm='HS256'
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'token': token, 'username': username}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
