// src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/db');

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 7;

const signAccess = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async ({ name, email, password }) => {
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at`,
    [name.trim(), email.toLowerCase().trim(), hashed]
  );
  const user = rows[0];
  return { user, accessToken: signAccess(user) };
};

const login = async ({ email, password }) => {
  const { rows } = await query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (!rows.length) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const { password: _, ...safeUser } = user;
  return { user: safeUser, accessToken: signAccess(safeUser) };
};

const getMe = async (userId) => {
  const { rows } = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (!rows.length) throw Object.assign(new Error('User not found'), { status: 404 });
  return rows[0];
};

module.exports = { register, login, getMe };
