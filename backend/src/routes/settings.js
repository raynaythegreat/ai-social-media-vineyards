import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const API_KEYS = ['OPENAI_API_KEY'];
const ENV_PATH = path.join(process.cwd(), '.env');

const parseEnv = (content) => {
  const lines = content.split(/\r?\n/);
  const parsed = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (!key) return;
    parsed[key] = rest.join('=');
  });
  return parsed;
};

const getStatus = () =>
  API_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(process.env[key]);
    return acc;
  }, {});

router.get('/', (req, res) => {
  res.json(getStatus());
});

router.post('/', (req, res) => {
  try {
    const updates = {};
    API_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = String(req.body[key] ?? '').trim();
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No API keys provided' });
    }

    const envValues = fs.existsSync(ENV_PATH)
      ? parseEnv(fs.readFileSync(ENV_PATH, 'utf-8'))
      : {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value === '') {
        delete envValues[key];
        delete process.env[key];
      } else {
        envValues[key] = value;
        process.env[key] = value;
      }
    });

    const lines = Object.entries(envValues).map(([key, val]) => `${key}=${val}`);
    const serialized = lines.length > 0 ? `${lines.join('\n')}\n` : '';
    fs.writeFileSync(ENV_PATH, serialized, 'utf-8');

    res.json({ success: true, status: getStatus() });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ error: 'Unable to save API keys' });
  }
});

export default router;
