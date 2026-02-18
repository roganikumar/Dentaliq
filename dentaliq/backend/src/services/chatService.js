// src/services/chatService.js
const { query } = require('../config/db');
const aiService = require('./aiService');

/**
 * Get chat history for a patient (ordered ASC for display)
 */
const getChatHistory = async (patientId) => {
  const { rows } = await query(
    `SELECT id, patient_id, role, content, created_at
     FROM chat_messages
     WHERE patient_id = $1
     ORDER BY created_at ASC`,
    [patientId]
  );
  return rows;
};

/**
 * Send a chat message:
 * 1. Verify patient exists
 * 2. Persist user message
 * 3. Fetch patient context (for AI grounding)
 * 4. Call AI service
 * 5. Persist AI response
 * 6. Return AI response + both stored messages
 */
const sendMessage = async (patientId, userId, userMessage) => {
  // 1. Verify patient
  const { rows: patients } = await query(
    'SELECT id, name, dob, medical_notes FROM patients WHERE id = $1 AND status != $2',
    [patientId, 'archived']
  );
  if (!patients.length) {
    throw Object.assign(new Error('Patient not found'), { status: 404 });
  }
  const patient = patients[0];

  // 2. Fetch recent history for context (last 10 exchanges)
  const { rows: history } = await query(
    `SELECT role, content FROM chat_messages
     WHERE patient_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [patientId]
  );
  const recentHistory = history.reverse(); // chronological order

  // 3. Persist user message
  const { rows: [userMsg] } = await query(
    `INSERT INTO chat_messages (patient_id, user_id, role, content)
     VALUES ($1, $2, 'user', $3) RETURNING id, role, content, created_at`,
    [patientId, userId, userMessage.trim()]
  );

  // 4. Call AI service with patient context
  let aiReply;
  try {
    aiReply = await aiService.generate({
      message: userMessage,
      patientContext: {
        name: patient.name,
        dob: patient.dob,
        medical_notes: patient.medical_notes,
      },
      history: recentHistory,
    });
  } catch (err) {
    console.error('AI service error:', err.message);
    // Graceful fallback — still persist a helpful error message
    aiReply = "I'm sorry, I'm unable to process your request right now. Please try again in a moment or contact your clinic staff directly.";
  }

  // 5. Persist AI response
  const { rows: [aiMsg] } = await query(
    `INSERT INTO chat_messages (patient_id, user_id, role, content)
     VALUES ($1, $2, 'assistant', $3) RETURNING id, role, content, created_at`,
    [patientId, null, aiReply]
  );

  return { userMessage: userMsg, aiMessage: aiMsg };
};

module.exports = { getChatHistory, sendMessage };
