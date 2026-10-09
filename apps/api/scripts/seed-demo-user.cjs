const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://sales_agent:sales_agent_dev@localhost:5433/ai_sales_agent';

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const password = process.env.DEMO_USER_PASSWORD || 'DemoSales123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Get an organization ID
    let orgRes = await client.query('SELECT id FROM organizations LIMIT 1');
    let orgId;
    if (orgRes.rows.length === 0) {
      const newOrg = await client.query(
        "INSERT INTO organizations (name, slug) VALUES ('VKU AI Enterprise', 'vku-ai-enterprise') RETURNING id"
      );
      orgId = newOrg.rows[0].id;
    } else {
      orgId = orgRes.rows[0].id;
    }

    // 1. Ensure demo user exists
    const demoEmail = (process.env.DEMO_USER_EMAIL || 'demo@ai-sales-agent.local').toLowerCase();
    const demoName = process.env.DEMO_USER_NAME || 'Demo Sales';

    let demoUserRes = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [demoEmail]
    );

    let demoUserId;
    if (demoUserRes.rows.length === 0) {
      const inserted = await client.query(
        `INSERT INTO users (organization_id, email, display_name, role)
         VALUES ($1, $2, $3, 'sale')
         RETURNING id`,
        [orgId, demoEmail, demoName]
      );
      demoUserId = inserted.rows[0].id;
      console.log(`Created demo user: ${demoEmail} (${demoUserId})`);
    } else {
      demoUserId = demoUserRes.rows[0].id;
      await client.query(
        "UPDATE users SET role = 'sale' WHERE id = $1 AND role NOT IN ('sale', 'admin')",
        [demoUserId]
      );
      console.log(`Found demo user: ${demoEmail} (${demoUserId})`);
    }

    // Upsert demo user credential
    await client.query(
      `INSERT INTO user_credentials (user_id, password_hash, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
      [demoUserId, passwordHash]
    );

    // 2. Also set password for admin user (bao.admin@vku.udn.vn) if exists
    const adminRes = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = 'bao.admin@vku.udn.vn'"
    );
    if (adminRes.rows.length > 0) {
      const adminId = adminRes.rows[0].id;
      await client.query(
        `INSERT INTO user_credentials (user_id, password_hash, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
        [adminId, passwordHash]
      );
      console.log(`Updated credentials for bao.admin@vku.udn.vn`);
    }

    // 3. Seed realistic demo leads
    const sampleLeads = [
      {
        firstName: 'Trần Văn',
        lastName: 'An',
        company: 'An Phát Logistics',
        email: 'an.tran@anphatlogistics.vn',
        phone: '+84905112233',
        status: 'qualified',
        score: 88.5,
      },
      {
        firstName: 'Lê Thị',
        lastName: 'Mai',
        company: 'Mai Group Retail',
        email: 'mai.le@maigroup.vn',
        phone: '+84918223344',
        status: 'contacted',
        score: 65.0,
      },
      {
        firstName: 'Hoàng',
        lastName: 'Minh',
        company: 'Minh Tech AI',
        email: 'minh.hoang@minhtech.io',
        phone: '+84935445566',
        status: 'new',
        score: 48.0,
      },
      {
        firstName: 'Đặng Quốc',
        lastName: 'Hưng',
        company: 'Hưng Thịnh Real Estate',
        email: 'hung.dang@hungthinh.vn',
        phone: '+84977889900',
        status: 'qualified',
        score: 92.0,
      },
    ];

    for (const lead of sampleLeads) {
      const existing = await client.query(
        'SELECT id FROM leads WHERE email = $1',
        [lead.email]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO leads (organization_id, first_name, last_name, company_name, email, phone, status, score, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'website_inbound')`,
          [
            orgId,
            lead.firstName,
            lead.lastName,
            lead.company,
            lead.email,
            lead.phone,
            lead.status,
            lead.score,
          ]
        );
      }
    }

    // 4. Seed pending quote approvals (WF-23)
    const pendingQuotes = await client.query(
      "SELECT id FROM approvals WHERE organization_id = $1 AND status = 'pending' AND approval_type ILIKE '%quote%'",
      [orgId]
    );

    if (pendingQuotes.rows.length === 0) {
      // Find a lead to associate
      const anPhat = await client.query("SELECT id FROM leads WHERE email = 'an.tran@anphatlogistics.vn' LIMIT 1");
      const anPhatId = anPhat.rows[0]?.id || orgId;

      await client.query(
        `INSERT INTO approvals (organization_id, entity_type, entity_id, approval_type, status, payload, requested_at)
         VALUES ($1, 'quote', $2, 'quote_discount_approval', 'pending', $3, NOW())`,
        [
          orgId,
          anPhatId,
          JSON.stringify({
            customer_name: 'Trần Văn An - An Phát Logistics',
            service_package: 'AI Sales Agent Voice Enterprise',
            contract_period: '12 Tháng',
            proposed_value_vnd: 150000000,
            discount_pct: 18,
            max_allowed_discount: 10,
            reason: 'Khách hàng quy mô 200 tổng đài viên, cam kết thanh toán trước 100% chi phí năm.',
            ai_recommendation: 'Khuyến nghị: Chấp thuận (Lợi nhuận gộp biên đạt 62%)',
          }),
        ]
      );

      const hungThinh = await client.query("SELECT id FROM leads WHERE email = 'hung.dang@hungthinh.vn' LIMIT 1");
      const hungThinhId = hungThinh.rows[0]?.id || orgId;

      await client.query(
        `INSERT INTO approvals (organization_id, entity_type, entity_id, approval_type, status, payload, requested_at)
         VALUES ($1, 'quote', $2, 'quote_pricing_exception', 'pending', $3, NOW() - interval '2 hours')`,
        [
          orgId,
          hungThinhId,
          JSON.stringify({
            customer_name: 'Đặng Quốc Hưng - Hưng Thịnh Real Estate',
            service_package: 'Customer 360 & Multi-Agent CRM Integration',
            contract_period: '24 Tháng',
            proposed_value_vnd: 280000000,
            discount_pct: 22,
            max_allowed_discount: 15,
            reason: 'Chiết khấu đặc biệt theo gói hợp tác chiến lược dự án Bất Động Sản.',
            ai_recommendation: 'Khuyến nghị: Chấp thuận kèm điều kiện gia hạn tự động.',
          }),
        ]
      );
      console.log('Created 2 pending quote approvals for demo');
    }

    console.log('✅ Demo data seeded successfully!');
  } catch (err) {
    console.error('Error seeding demo user:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
