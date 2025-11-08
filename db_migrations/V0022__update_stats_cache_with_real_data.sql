UPDATE stats_cache 
SET 
  total_products = (SELECT COUNT(*) FROM products),
  total_files = (
    SELECT 
      COALESCE(SUM(CASE WHEN sample_pdf_url IS NOT NULL AND sample_pdf_url != '' THEN 1 ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN full_pdf_with_answers_url IS NOT NULL AND full_pdf_with_answers_url != '' THEN 1 ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN full_pdf_without_answers_url IS NOT NULL AND full_pdf_without_answers_url != '' THEN 1 ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN trainer1_url IS NOT NULL AND trainer1_url != '' THEN 1 ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN trainer2_url IS NOT NULL AND trainer2_url != '' THEN 1 ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN trainer3_url IS NOT NULL AND trainer3_url != '' THEN 1 ELSE 0 END), 0)
    FROM products
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;