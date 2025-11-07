CREATE TABLE IF NOT EXISTS stats_cache (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_products INTEGER NOT NULL DEFAULT 0,
    total_files INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO stats_cache (id, total_products, total_files, updated_at)
VALUES (1, 0, 0, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;