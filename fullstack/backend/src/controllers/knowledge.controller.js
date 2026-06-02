const catchAsync = require('../utils/catch-async');
const knowledgeService = require('../services/knowledge.service');
const auditLog = require('../services/audit-log.service');

const getKnowledges = catchAsync(async (req, res) => {
  const result = await knowledgeService.getKnowledges(req.query);
  res.json({ status: 'success', data: result.knowledges, pagination: result.pagination });
});

const createKnowledge = catchAsync(async (req, res) => {
  const knowledge = await knowledgeService.createKnowledge(req.body);

  await auditLog.log({
    userId: req.user.id,
    action: 'create',
    entity: 'knowledge',
    entityId: knowledge.id,
    details: `Added knowledge: ${knowledge.title}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ status: 'success', data: { knowledge } });
});

const updateKnowledge = catchAsync(async (req, res) => {
  const knowledge = await knowledgeService.updateKnowledge(req.params.id, req.body);

  await auditLog.log({
    userId: req.user.id,
    action: 'update',
    entity: 'knowledge',
    entityId: parseInt(req.params.id),
    details: `Updated knowledge: ${knowledge.title}`,
    ipAddress: req.ip,
  });

  res.json({ status: 'success', data: { knowledge } });
});

const deleteKnowledge = catchAsync(async (req, res) => {
  await knowledgeService.deleteKnowledge(req.params.id);

  await auditLog.log({
    userId: req.user.id,
    action: 'delete',
    entity: 'knowledge',
    entityId: parseInt(req.params.id),
    details: `Deleted knowledge #${req.params.id}`,
    ipAddress: req.ip,
  });

  res.status(204).send();
});

module.exports = { getKnowledges, createKnowledge, updateKnowledge, deleteKnowledge };
