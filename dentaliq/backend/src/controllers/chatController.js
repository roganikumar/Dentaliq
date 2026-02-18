// src/controllers/chatController.js
const chatService = require('../services/chatService');

const history = async (req, res, next) => {
  try {
    const messages = await chatService.getChatHistory(req.params.patientId);
    res.json({ messages });
  } catch (err) { next(err); }
};

const send = async (req, res, next) => {
  try {
    const { patientId, message } = req.body;
    const result = await chatService.sendMessage(patientId, req.user.id, message);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

module.exports = { history, send };
