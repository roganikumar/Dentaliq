// src/controllers/patientController.js
const patientService = require('../services/patientService');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const result = await patientService.listPatients({
      page: Math.max(1, parseInt(page, 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
      search,
      status,
    });
    res.json(result);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const patient = await patientService.getPatient(req.params.id);
    res.json(patient);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body, req.user.id);
    res.status(201).json(patient);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    res.json(patient);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await patientService.deletePatient(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove };
