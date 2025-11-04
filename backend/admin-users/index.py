import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import jwt

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get list of registered users for admin panel
    Args: event with httpMethod GET
    Returns: List of users with email, full_name, created_at
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = event.get('headers', {})
    admin_token = headers.get('X-Admin-Token') or headers.get('x-admin-token')
    
    if not admin_token:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    ADMIN_SECRET_KEY = os.environ.get('ADMIN_JWT_SECRET', 'admin-secret-key-change-in-production')
    
    try:
        payload = jwt.decode(admin_token, ADMIN_SECRET_KEY, algorithms=['HS256'])
        if 'admin_id' not in payload:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid token'})
            }
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid token'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("""
        SELECT 
            id,
            email,
            full_name,
            created_at
        FROM t_p99209851_math_resources_site.users
        ORDER BY created_at DESC
    """)
    
    users = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    users_list = []
    for user in users:
        users_list.append({
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'created_at': user['created_at'].isoformat() if user['created_at'] else None
        })
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'users': users_list})
    }