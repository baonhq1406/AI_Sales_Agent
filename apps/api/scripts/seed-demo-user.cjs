const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const port = process.env.POSTGRES_PORT || 5435;
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER || 'sales_agent'}:${process.env.POSTGRES_PASSWORD || 'sales_agent_dev'}@localhost:${port}/${process.env.POSTGRES_DB || 'ai_sales_agent'}`;

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const password = process.env.DEMO_USER_PASSWORD || 'DemoSales123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Get an organization ID
    let orgRes = await client.query('SELECT id FROM organizations LIMIT 1');
    let orgId;
    if (orgRes.rows.length === 0) {
      const newOrg = await client.query(
        "INSERT INTO organizations (id, name) VALUES ('11111111-1111-4111-8111-111111111111', 'VKU AI Enterprise') RETURNING id"
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

    // 2. Ensure admin user (baonhq.24it@vku.udn.vn) exists and has credentials
    const adminEmails = ['baonhq.24it@vku.udn.vn', 'bao.admin@vku.udn.vn'];
    for (const adminEmail of adminEmails) {
      let adminRes = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = $1',
        [adminEmail]
      );
      let adminId;
      if (adminRes.rows.length === 0) {
        const insertedAdmin = await client.query(
          `INSERT INTO users (organization_id, email, display_name, role)
           VALUES ($1, $2, $3, 'admin')
           RETURNING id`,
          [orgId, adminEmail, 'Nguyễn Hữu Quốc Bảo']
        );
        adminId = insertedAdmin.rows[0].id;
        console.log(`Created admin user: ${adminEmail} (${adminId})`);
      } else {
        adminId = adminRes.rows[0].id;
        await client.query(
          "UPDATE users SET role = 'admin', display_name = COALESCE(display_name, 'Nguyễn Hữu Quốc Bảo') WHERE id = $1",
          [adminId]
        );
      }
      await client.query(
        `INSERT INTO user_credentials (user_id, password_hash, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
        [adminId, passwordHash]
      );
      console.log(`Updated credentials for ${adminEmail}`);
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

    // 5. Seed Customer 360 profiles (Health Score & Churn Risk)
    const allLeads = await client.query('SELECT id, email, company_name FROM leads WHERE organization_id = $1', [orgId]);
    for (const lead of allLeads.rows) {
      const existingProfile = await client.query('SELECT id FROM customer_profiles WHERE lead_id = $1', [lead.id]);
      if (existingProfile.rows.length === 0) {
        let healthScore = 75.0;
        let churnRisk = 20.0;
        let stage = 'lead';
        if (lead.email?.includes('an.tran') || lead.company_name?.includes('An Phát')) {
          healthScore = 92.5; churnRisk = 8.5; stage = 'opportunity';
        } else if (lead.email?.includes('hung.dang') || lead.company_name?.includes('Hưng Thịnh')) {
          healthScore = 94.0; churnRisk = 6.0; stage = 'opportunity';
        } else if (lead.email?.includes('minh.hoang') || lead.company_name?.includes('Minh Tech')) {
          healthScore = 41.0; churnRisk = 76.5; stage = 'at_risk';
        } else if (lead.email?.includes('yen.vo') || lead.company_name?.includes('Yen Beauty')) {
          healthScore = 35.0; churnRisk = 84.0; stage = 'at_risk';
        } else if (lead.email?.includes('mai.le') || lead.company_name?.includes('Mai Group')) {
          healthScore = 64.5; churnRisk = 42.0; stage = 'customer';
        } else if (lead.company_name?.includes('VKU Sales')) {
          healthScore = 98.0; churnRisk = 3.0; stage = 'advocate';
        }
        await client.query(
          `INSERT INTO customer_profiles (organization_id, lead_id, lifecycle_stage, health_score, churn_risk, attributes)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [orgId, lead.id, stage, healthScore, churnRisk, JSON.stringify({ segment: 'B2B', priority: churnRisk >= 70 ? 'high_urgency' : 'normal' })]
        );
      }
    }

    // 6. Seed pending tasks in agent_tasks (WF-04)
    const pendingTaskRes = await client.query("SELECT id FROM agent_tasks WHERE organization_id = $1 AND status = 'pending'", [orgId]);
    if (pendingTaskRes.rows.length === 0) {
      await client.query(
        `INSERT INTO agent_tasks (organization_id, agent_name, status, input)
         VALUES ($1, 'WF-04 Autonomous Workflow Agent', 'pending', $2::jsonb)`,
        [orgId, JSON.stringify({ task: 'Đồng bộ dữ liệu CRM đa kênh & Chấm điểm định kỳ', schedule: 'hourly' })]
      );
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
