// src/services/patientService.js
const { query } = require('../config/db');

/**
 * List patients with pagination, search, and status filter.
 * Uses offset pagination (simple) — cursor-based recommended at scale.
 */
const listPatients = async ({ page = 1, limit = 10, search = '', status = '' }) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.email ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}::patient_status`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM patients p ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT
       p.id, p.name, p.email, p.phone, p.dob, p.medical_notes,
       p.status, p.created_at, p.updated_at,
       u.name AS created_by_name
     FROM patients p
     LEFT JOIN users u ON u.id = p.created_by
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

const getPatient = async (id) => {
  const { rows } = await query(
    `SELECT p.*, u.name AS created_by_name
     FROM patients p
     LEFT JOIN users u ON u.id = p.created_by
     WHERE p.id = $1`,
    [id]
  );
  if (!rows.length) throw Object.assign(new Error('Patient not found'), { status: 404 });
  return rows[0];
};

const createPatient = async ({ name, email, phone, dob, medical_notes }, userId) => {
  const { rows } = await query(
    `INSERT INTO patients (name, email, phone, dob, medical_notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name.trim(), email?.toLowerCase().trim() || null, phone?.trim() || null, dob || null, medical_notes?.trim() || null, userId]
  );
  return rows[0];
};

const updatePatient = async (id, updates) => {
  // Build SET clause dynamically from allowed fields
  const allowed = ['name', 'email', 'phone', 'dob', 'medical_notes', 'status'];
  const setClauses = [];
  const params = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      params.push(updates[key]);
      setClauses.push(`${key} = $${params.length}`);
    }
  }

  if (!setClauses.length) {
    throw Object.assign(new Error('No valid fields to update'), { status: 400 });
  }

  params.push(id);
  const { rows } = await query(
    `UPDATE patients SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows.length) throw Object.assign(new Error('Patient not found'), { status: 404 });
  return rows[0];
};

const deletePatient = async (id) => {
  // Soft delete by setting status to 'archived'
  const { rows } = await query(
    `UPDATE patients SET status = 'archived' WHERE id = $1 AND status != 'archived' RETURNING id`,
    [id]
  );
  if (!rows.length) throw Object.assign(new Error('Patient not found'), { status: 404 });
  return { id, archived: true };
};

module.exports = { listPatients, getPatient, createPatient, updatePatient, deletePatient };
