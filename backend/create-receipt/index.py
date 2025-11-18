'''
Business: Создание чека самозанятого через API Сбербизнеса (Мой налог)
Args: event - dict с httpMethod, body (amount, customer_email, services)
      context - object с request_id
Returns: HTTP response с данными чека или ошибкой
'''
import json
import os
import urllib.request
from typing import Dict, Any

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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    amount = body_data.get('amount')
    customer_email = body_data.get('customer_email')
    services = body_data.get('services', [])
    
    if not amount or not customer_email or not services:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Missing required fields'}),
            'isBase64Encoded': False
        }
    
    token = os.environ.get('SBERBUSINESS_API_TOKEN')
    
    if not token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'API token not configured'}),
            'isBase64Encoded': False
        }
    
    receipt_data = {
        'incomeInfo': {
            'amount': float(amount),
            'incomeType': 'FROM_LEGAL_ENTITY',
            'customerOrganization': customer_email
        },
        'services': [
            {
                'name': service['name'],
                'amount': float(service['price']),
                'quantity': service.get('quantity', 1)
            }
            for service in services
        ]
    }
    
    receipt_payload = json.dumps(receipt_data).encode('utf-8')
    
    receipt_req = urllib.request.Request(
        'https://npd.vtb.ru/api/v1/partner/income',
        data=receipt_payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    
    try:
        receipt_response = urllib.request.urlopen(receipt_req)
        receipt_result = json.loads(receipt_response.read().decode())
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'success',
                'receipt': receipt_result
            }),
            'isBase64Encoded': False
        }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f'[RECEIPT] API Error: {error_body}')
        
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Receipt creation failed: {error_body}'
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f'[RECEIPT] Unexpected error: {str(e)}')
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Unexpected error: {str(e)}'
            }),
            'isBase64Encoded': False
        }