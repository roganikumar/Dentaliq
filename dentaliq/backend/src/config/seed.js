// src/config/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    await client.query('BEGIN');

    // Demo user (admin)
    const hash = await bcrypt.hash('password123', 12);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Dr. Ramesh Kumar', 'admin@dentaliq.com', hash, 'admin']
    );

    // Demo patients
    const patients = [
      { name: 'Priya Nair', email: 'priya@example.com', phone: '+91 98765 43210', dob: '1990-05-12', notes: 'Mild sensitivity to cold. Regular cleanings. No allergies.' },
      { name: 'Arjun Mehta', email: 'arjun@example.com', phone: '+91 88001 23456', dob: '1972-09-03', notes: 'History of root canal on tooth #19. Crown pending. Diabetic — monitor healing.' },
      { name: 'Sunita Rao', email: 'sunita@example.com', phone: '+91 77891 00011', dob: '1997-01-19', notes: 'Good oral hygiene. Recent whitening. Minor gum recession observed.' },
      { name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 90001 55567', dob: '1980-12-07', notes: 'Heavy smoker. Periodontal risk. Missed last two follow-up appointments.' },
      { name: 'Meena Krishnan', email: 'meena@example.com', phone: '+91 81234 56789', dob: '1964-03-25', notes: 'Partial denture lower jaw. Mild periodontitis — on Chlorhexidine. Arthritis limits manual brushing.' },
    ];

    const patientIds = [];
    for (const p of patients) {
      const { rows: [pat] } = await client.query(
        `INSERT INTO patients (name, email, phone, dob, medical_notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [p.name, p.email, p.phone, p.dob, p.notes, user.id]
      );
      if (pat) patientIds.push(pat.id);
    }

    // Sample chat messages for first patient
    if (patientIds.length > 0) {
      await client.query(
        `INSERT INTO chat_messages (patient_id, user_id, role, content) VALUES
         ($1, $2, 'user', 'What are good home care tips for someone with mild gum sensitivity?'),
         ($1, $2, 'assistant', 'For mild gum sensitivity, I recommend: use a soft-bristled toothbrush with gentle circular motions, switch to a sensitivity-formula toothpaste with potassium nitrate or stannous fluoride, avoid acidic foods/drinks for 30 minutes after brushing, and rinse with an alcohol-free fluoride mouthwash. Also make sure you are flossing daily — careful flossing actually reduces gum sensitivity over time by improving gum health.')`,
        [patientIds[0], user.id]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete. Login: admin@dentaliq.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
