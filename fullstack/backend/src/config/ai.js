const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./env');
const logger = require('./logger');

let genAI = null;

// List of available Gemini models for article generation (Updated 2026)
const AVAILABLE_GEMINI_MODELS = [
  // --- Seri Gemini 3 (Terbaru & Paling Cerdas) ---
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', description: 'Sangat cerdas & stabil, performa frontier untuk semua tugas' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview', description: 'Advanced thinking: terbaik untuk reasoning & logika kompleks' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', description: 'Ultra-cepat & paling hemat untuk volume tinggi' },

  // --- Seri Gemini 2.5 (Stabil & Hemat) ---
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Konteks panjang dengan penalaran mendalam' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Keseimbangan harga & performa terbaik dari gen 2.5' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Ringan & sangat murah, cocok untuk draft cepat' },
];

// Bisa ubah default model ke yang terbaru
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

const _ensureGenAI = () => {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
};

/**
 * Returns the default Gemini model instance.
 */
const getModel = () => {
  const ai = _ensureGenAI();
  logger.info(`[AI] Using default model: ${DEFAULT_GEMINI_MODEL}`);
  return ai.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
};

/**
 * Returns a Gemini model instance by specific model ID.
 * Falls back to default model if the given ID is not in the allowed list.
 * @param {string} modelId - Model ID from AVAILABLE_GEMINI_MODELS
 */
const getModelByName = (modelId) => {
  const ai = _ensureGenAI();
  const isValid = AVAILABLE_GEMINI_MODELS.some((m) => m.id === modelId);
  const selectedModel = isValid ? modelId : DEFAULT_GEMINI_MODEL;

  if (!isValid) {
    logger.warn(`[AI] Unknown model "${modelId}", falling back to default: ${DEFAULT_GEMINI_MODEL}`);
  } else {
    logger.info(`[AI] Using model: ${selectedModel}`);
  }

  return ai.getGenerativeModel({ model: selectedModel });
};

module.exports = { getModel, getModelByName, AVAILABLE_GEMINI_MODELS, DEFAULT_GEMINI_MODEL };
