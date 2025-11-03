CREATE TABLE IF NOT EXISTS t_p99209851_math_resources_site.admin_2fa_codes (
    id SERIAL PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_admin_2fa_email ON t_p99209851_math_resources_site.admin_2fa_codes(admin_email);
CREATE INDEX idx_admin_2fa_expires ON t_p99209851_math_resources_site.admin_2fa_codes(expires_at);