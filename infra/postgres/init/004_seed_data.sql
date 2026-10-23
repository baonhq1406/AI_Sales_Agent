-- 004_seed_data.sql
-- Seed data for AI Sales Agent & Customer 360
-- Compatible with postgres 17 + pgvector + pgcrypto

-- 1. Default Organization
INSERT INTO organizations (id, name)
VALUES ('11111111-1111-4111-8111-111111111111', 'VKU AI Enterprise')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Users (Admin Bảo & Demo Sales)
INSERT INTO users (id, organization_id, email, display_name, role)
VALUES 
  ('d2d0dbbb-06cf-4e31-89c2-88412a1e1eea', '11111111-1111-4111-8111-111111111111', 'baonhq.24it@vku.udn.vn', 'Nguyễn Hữu Quốc Bảo', 'admin'),
  ('19d5f5b0-df57-4ff4-a989-d9d0c99e2229', '11111111-1111-4111-8111-111111111111', 'bao.admin@vku.udn.vn', 'Bao Admin', 'admin'),
  ('ef337292-81be-449d-a724-cf0cb83ee545', '11111111-1111-4111-8111-111111111111', 'demo@ai-sales-agent.local', 'Demo Sales', 'sale')
ON CONFLICT (organization_id, email) DO UPDATE 
SET display_name = EXCLUDED.display_name, role = EXCLUDED.role;

-- 3. User Credentials (password: DemoSales123!)
INSERT INTO user_credentials (user_id, password_hash)
VALUES
  ('d2d0dbbb-06cf-4e31-89c2-88412a1e1eea', crypt('DemoSales123!', gen_salt('bf', 10))),
  ('19d5f5b0-df57-4ff4-a989-d9d0c99e2229', crypt('DemoSales123!', gen_salt('bf', 10))),
  ('ef337292-81be-449d-a724-cf0cb83ee545', crypt('DemoSales123!', gen_salt('bf', 10)))
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

-- 4. Realistic Leads
INSERT INTO leads (id, organization_id, first_name, last_name, company_name, email, phone, status, score, source, metadata)
VALUES
  ('b6cc91dc-2f3a-4a10-b5f8-09950cb7dd52', '11111111-1111-4111-8111-111111111111', 'Trần Văn', 'An', 'An Phát Logistics', 'an.tran@anphatlogistics.vn', '+84905112233', 'qualified', 88.50, 'website_inbound', '{"segment":"Logistics","priority":"high"}'::jsonb),
  ('4ca8aeff-cb7b-425d-9ba9-fbcf9b323204', '11111111-1111-4111-8111-111111111111', 'Đặng Quốc', 'Hưng', 'Hưng Thịnh Real Estate', 'hung.dang@hungthinh.vn', '+84977889900', 'qualified', 92.00, 'referral', '{"segment":"Bất Động Sản","priority":"high"}'::jsonb),
  ('51cef5bd-f6ed-4131-a458-baf1a05d9830', '11111111-1111-4111-8111-111111111111', 'Lê Thị', 'Mai', 'Mai Group Retail', 'mai.le@maigroup.vn', '+84918223344', 'contacted', 65.00, 'facebook_ads', '{"segment":"Bán lẻ","priority":"medium"}'::jsonb),
  ('0a226697-b815-4059-89f6-fa71278cc433', '11111111-1111-4111-8111-111111111111', 'Hoàng', 'Minh', 'Minh Tech AI', 'minh.hoang@minhtech.io', '+84935445566', 'new', 48.00, 'google_search', '{"segment":"Công nghệ","priority":"medium"}'::jsonb),
  ('87d6a855-7904-4bd7-8933-539d6979ede5', '11111111-1111-4111-8111-111111111111', 'Võ Hoàng', 'Yến', 'Yen Beauty Spa', 'yen.vo@yenbeauty.vn', '+84912345678', 'new', 38.00, 'tiktok_ads', '{"segment":"Dịch vụ làm đẹp","priority":"low"}'::jsonb),
  ('09c7c82e-fd9a-4c98-a0ba-9c38467591aa', '11111111-1111-4111-8111-111111111111', 'Nguyễn Minh Khang', '', 'VKU Innovation Lab', 'khang.nguyen@vku.edu.vn', '+84987112233', 'new', 75.00, 'campus_event', '{"segment":"Giáo dục & NCKH","priority":"medium"}'::jsonb),
  ('c1735d29-7e64-417b-9d7b-a82bf1d76691', '11111111-1111-4111-8111-111111111111', 'Bao', 'Nguyen', 'VKU Sales Corp', 'bao.test@vku.udn.vn', '+84987654321', 'proposal_sent', 100.00, 'sales_workspace', '{"segment":"Enterprise","priority":"highest"}'::jsonb),
  ('4cf55e7f-d2c6-4678-8525-e2219dbfb9a1', '11111111-1111-4111-8111-111111111111', 'Anh Bảo VKU', '', 'VKU Enterprise Partner', 'bao.partner@vku.udn.vn', '+84905123456', 'contacted', 100.00, 'sales_workspace', '{"segment":"Partner","priority":"highest"}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    company_name = EXCLUDED.company_name,
    status = EXCLUDED.status,
    score = EXCLUDED.score;

-- 5. Customer Profiles (Customer 360 Health Score & Churn Risk)
INSERT INTO customer_profiles (organization_id, lead_id, lifecycle_stage, health_score, churn_risk, attributes)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'b6cc91dc-2f3a-4a10-b5f8-09950cb7dd52', 'opportunity', 92.50, 8.50, '{"tier":"Tier 1","segment":"B2B"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', '4ca8aeff-cb7b-425d-9ba9-fbcf9b323204', 'opportunity', 94.00, 6.00, '{"tier":"Tier 1","segment":"B2B"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', '51cef5bd-f6ed-4131-a458-baf1a05d9830', 'customer', 64.50, 42.00, '{"tier":"Tier 2","segment":"Retail"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', '0a226697-b815-4059-89f6-fa71278cc433', 'at_risk', 41.00, 76.50, '{"tier":"Tier 2","segment":"SaaS","urgency":"high"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', '87d6a855-7904-4bd7-8933-539d6979ede5', 'at_risk', 35.00, 84.00, '{"tier":"Tier 3","segment":"Spa","urgency":"high"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', '09c7c82e-fd9a-4c98-a0ba-9c38467591aa', 'lead', 75.00, 20.00, '{"tier":"Tier 2","segment":"Education"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', 'c1735d29-7e64-417b-9d7b-a82bf1d76691', 'advocate', 98.00, 3.00, '{"tier":"Enterprise VIP","segment":"Strategic"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', '4cf55e7f-d2c6-4678-8525-e2219dbfb9a1', 'advocate', 96.00, 4.00, '{"tier":"Enterprise Partner","segment":"Strategic"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 6. Pending & Historical Approvals (WF-23 HITL)
INSERT INTO approvals (id, organization_id, entity_type, entity_id, approval_type, status, payload, requested_at)
VALUES
  ('672e3fee-8b20-4d5f-bfa7-d2b3e7fdda42', '11111111-1111-4111-8111-111111111111', 'quote', 'b6cc91dc-2f3a-4a10-b5f8-09950cb7dd52', 'quote_discount_approval', 'pending', '{
    "customer_name": "Trần Văn An - An Phát Logistics",
    "service_package": "AI Sales Agent Voice Enterprise",
    "contract_period": "12 Tháng",
    "proposed_value_vnd": 150000000,
    "discount_pct": 18,
    "max_allowed_discount": 10,
    "reason": "Khách hàng quy mô 200 tổng đài viên, cam kết thanh toán trước 100% chi phí năm.",
    "ai_recommendation": "Khuyến nghị: Chấp thuận (Lợi nhuận gộp biên đạt 62%)"
  }'::jsonb, NOW() - interval '3 hours'),
  ('eccd946a-833f-4b10-9a4a-99632a78a6bb', '11111111-1111-4111-8111-111111111111', 'quote', '4ca8aeff-cb7b-425d-9ba9-fbcf9b323204', 'quote_discount_approval', 'pending', '{
    "customer_name": "Đặng Quốc Hưng - Hưng Thịnh Real Estate",
    "service_package": "Customer 360 & Multi-Agent CRM Integration",
    "contract_period": "24 Tháng",
    "proposed_value_vnd": 280000000,
    "discount_pct": 22,
    "max_allowed_discount": 15,
    "reason": "Chiết khấu đặc biệt theo gói hợp tác chiến lược dự án Bất Động Sản.",
    "ai_recommendation": "Khuyến nghị: Chấp thuận kèm điều kiện gia hạn tự động."
  }'::jsonb, NOW() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- 7. Agent Tasks (WF-04 Autonomous Workflow Agent)
INSERT INTO agent_tasks (organization_id, agent_name, status, input)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'WF-04 Autonomous Workflow Agent', 'pending', '{"task":"Đồng bộ dữ liệu CRM đa kênh & Chấm điểm định kỳ","schedule":"hourly"}'::jsonb)
ON CONFLICT DO NOTHING;
