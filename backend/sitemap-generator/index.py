'''
Генерирует sitemap.xml с изображениями товаров для индексации в Яндексе
Args: event - GET запрос
Returns: XML-файл с картой сайта
'''
import os
import json
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

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
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Получаем все товары с изображениями
    cursor.execute("""
        SELECT id, title, preview_image_url, updated_at, category
        FROM t_p99209851_math_resources_site.products
        WHERE preview_image_url IS NOT NULL AND preview_image_url != ''
        ORDER BY id
    """)
    
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Генерируем XML
    base_url = 'https://mk-room.ru'
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
        '',
        '  <!-- Главная страница -->',
        '  <url>',
        f'    <loc>{base_url}/</loc>',
        f'    <lastmod>{current_date}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
        ''
    ]
    
    # Страницы категорий
    categories = ['5-klass', '6-klass', '7-klass', '8-klass', '9-klass', '10-klass', '11-klass', 'oge', 'ege']
    for cat in categories:
        xml_lines.extend([
            '  <url>',
            f'    <loc>{base_url}/{cat}</loc>',
            f'    <lastmod>{current_date}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.8</priority>',
            '  </url>',
            ''
        ])
    
    # Страницы товаров с изображениями
    for product in products:
        product_date = product['updated_at'].strftime('%Y-%m-%d') if product['updated_at'] else current_date
        
        xml_lines.extend([
            '  <url>',
            f'    <loc>{base_url}/product/{product["id"]}</loc>',
            f'    <lastmod>{product_date}</lastmod>',
            '    <changefreq>monthly</changefreq>',
            '    <priority>0.7</priority>',
            '    <image:image>',
            f'      <image:loc>{product["preview_image_url"]}</image:loc>',
            f'      <image:title>{product["title"]}</image:title>',
            f'      <image:caption>Материалы по математике - {product["category"]}</image:caption>',
            '    </image:image>',
            '  </url>',
            ''
        ])
    
    xml_lines.append('</urlset>')
    
    sitemap_xml = '\n'.join(xml_lines)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
        },
        'body': sitemap_xml,
        'isBase64Encoded': False
    }