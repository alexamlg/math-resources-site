-- Сброс кеша статистики для пересчета
UPDATE stats_cache SET updated_at = CURRENT_TIMESTAMP - INTERVAL '25 hours' WHERE id = 1;