'''
Business: Тестовая функция для проверки Telegram уведомлений
Args: event - GET запрос
Returns: Отправляет тестовое уведомление и возвращает результат
'''
import json
import urllib.request
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    bot_token = '8259130107:AAFkKp8ceMRjUkQs-A77JYaXeLNRE_vpdWY'
    chat_id = '927682281'
    
    message = f"""🎉 <b>ТЕСТОВАЯ покупка!</b>

💰 <b>Сумма:</b> 999 ₽
📧 <b>Email покупателя:</b> test@example.com

📦 <b>Купленные материалы:</b>
  • Тестовый тренажер по математике

✅ Это тестовое уведомление для проверки работы бота"""
    
    telegram_data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    req = urllib.request.Request(
        url,
        data=json.dumps(telegram_data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        response = urllib.request.urlopen(req)
        response_data = json.loads(response.read().decode())
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True, 
                'message': 'Тестовое уведомление отправлено! Проверь Telegram',
                'telegram_response': response_data
            }),
            'isBase64Encoded': False
        }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Telegram API error',
                'details': error_body,
                'help': 'Убедись, что ты нажала START в боте @mkroom_bot'
            }),
            'isBase64Encoded': False
        }
