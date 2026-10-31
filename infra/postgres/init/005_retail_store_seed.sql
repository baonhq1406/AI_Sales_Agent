-- 005_retail_store_seed.sql
-- Thêm dữ liệu khách hàng bán lẻ TechZone & Document Chunks cho RAG
INSERT INTO leads (id, organization_id, first_name, last_name, company_name, email, phone, status, score, source, metadata)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Hoàng', 'Long', 'TechZone Retail (Đà Nẵng)', 'hoanglong.dn@gmail.com', '+84905888123', 'qualified', 95.00, 'retail_store', '{"product_interest":"iPhone 16 Pro Max 256GB Titan Sa Mạc","branch":"Đà Nẵng","channel":"hotline"}'::jsonb),
  ('a1b2c3d4-0002-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Ngọc', 'Trâm', 'TechZone Retail (TP.HCM)', 'ngoctram.sg@gmail.com', '+84912334455', 'qualified', 92.00, 'retail_store', '{"product_interest":"MacBook Pro 14 M4 24GB Space Black","branch":"TP.HCM","channel":"website"}'::jsonb),
  ('a1b2c3d4-0003-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Quốc', 'Bảo', 'TechZone Retail (Hà Nội)', 'quocbao.hn@gmail.com', '+84988776655', 'qualified', 89.00, 'retail_store', '{"product_interest":"Mac Mini M4 16GB / 256GB","branch":"Hà Nội","channel":"facebook"}'::jsonb),
  ('a1b2c3d4-0004-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Thảo', 'Vy', 'TechZone Retail (Đà Nẵng)', 'thaovy.dn@gmail.com', '+84905332211', 'contacted', 88.00, 'retail_store', '{"product_interest":"iPad Air M2 11-inch Xanh Dương","branch":"Đà Nẵng","channel":"zalo"}'::jsonb),
  ('a1b2c3d4-0005-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Tuấn', 'Kiệt', 'TechZone Retail (TP.HCM)', 'tuankiet.hcm@gmail.com', '+84934556677', 'qualified', 90.00, 'retail_store', '{"product_interest":"Apple Watch Ultra 2 Titanium Đen","branch":"TP.HCM","channel":"hotline"}'::jsonb),
  ('a1b2c3d4-0006-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Thanh', 'Hằng', 'TechZone Retail (Hà Nội)', 'thanhhang.hn@gmail.com', '+84977112244', 'contacted', 86.00, 'retail_store', '{"product_interest":"AirPods Pro 2 USB-C & AirPods 4 ANC","branch":"Hà Nội","channel":"website"}'::jsonb),
  ('a1b2c3d4-0007-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Đức', 'Trọng', 'TechZone Retail (Đà Nẵng)', 'ductrong.dn@gmail.com', '+84905667788', 'new', 85.00, 'retail_store', '{"product_interest":"Loa Marshall Stanmore III Kem","branch":"Đà Nẵng","channel":"store_visit"}'::jsonb),
  ('a1b2c3d4-0008-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Mai', 'Anh', 'TechZone Retail (Hà Nội)', 'maianh.tradein@gmail.com', '+84918990011', 'qualified', 91.00, 'retail_store', '{"product_interest":"Thu cũ đổi mới iPhone 13 lên iPhone 16 Plus","branch":"Hà Nội","channel":"trade_in"}'::jsonb),
  ('a1b2c3d4-0009-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'Quang', 'Huy', 'TechZone Retail (TP.HCM)', 'quanghuy.mac@gmail.com', '+84944556688', 'qualified', 87.00, 'retail_store', '{"product_interest":"Trả góp 0% MacBook Air M3 16GB/256GB","branch":"TP.HCM","channel":"installment"}'::jsonb),
  ('a1b2c3d4-0010-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'Bích', 'Phương', 'TechZone Retail (Đà Nẵng)', 'bichphuong.student@gmail.com', '+84905223344', 'contacted', 84.00, 'retail_store', '{"product_interest":"Ưu đãi HSSV mua iPad Gen 10 64GB","branch":"Đà Nẵng","channel":"campus"}'::jsonb),
  ('a1b2c3d4-0011-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'Hải', 'Nam', 'TechZone Retail (Hà Nội)', 'hainam.apple@gmail.com', '+84989334422', 'qualified', 93.00, 'retail_store', '{"product_interest":"iPhone 16 Pro 128GB Titan Tự Nhiên","branch":"Hà Nội","channel":"hotline"}'::jsonb),
  ('a1b2c3d4-0012-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'Minh', 'Thư', 'TechZone Retail (TP.HCM)', 'minhthu.audio@gmail.com', '+84938445566', 'qualified', 89.00, 'retail_store', '{"product_interest":"AirPods Max USB-C Midnight","branch":"TP.HCM","channel":"instagram"}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    company_name = EXCLUDED.company_name,
    status = EXCLUDED.status,
    score = EXCLUDED.score,
    metadata = EXCLUDED.metadata;
