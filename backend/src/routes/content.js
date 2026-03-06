import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dbOperations } from '../db/database.js';
import { analyzeImage, generateStoryIdeas } from '../services/openai.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload and analyze image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { eventType = 'General', mood = 'Warm' } = req.body;
    const imagePath = req.file.path;
    const imageFilename = req.file.filename;

    // Analyze image with OpenAI
    const content = await analyzeImage(imagePath);

    // Save to database
    const result = dbOperations.run(`
      INSERT INTO content (
        image_path, image_filename, event_type, mood,
        description, instagram_caption, facebook_caption, 
        twitter_caption, hashtags, story_ideas, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [
      imagePath,
      imageFilename,
      eventType,
      mood,
      content.description,
      content.instagram_caption,
      content.facebook_caption,
      content.twitter_caption,
      JSON.stringify(content.hashtags),
      JSON.stringify(content.story_ideas)
    ]);

    const savedContent = dbOperations.get('SELECT * FROM content WHERE id = ?', [result.lastInsertRowid]);

    res.json({
      success: true,
      content: {
        id: savedContent.id,
        imageUrl: `/uploads/${savedContent.image_filename}`,
        ...savedContent
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all content
router.get('/', (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM content';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    
    const content = dbOperations.all(query, params);
    
    const contentWithUrls = content.map(item => ({
      ...item,
      imageUrl: `/uploads/${item.image_filename}`,
      hashtags: JSON.parse(item.hashtags || '[]'),
      story_ideas: JSON.parse(item.story_ideas || '[]')
    }));

    res.json(contentWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single content
router.get('/:id', (req, res) => {
  try {
    const content = dbOperations.get('SELECT * FROM content WHERE id = ?', [req.params.id]);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      ...content,
      imageUrl: `/uploads/${content.image_filename}`,
      hashtags: JSON.parse(content.hashtags || '[]'),
      story_ideas: JSON.parse(content.story_ideas || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update content
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = [
      'instagram_caption', 'facebook_caption', 'twitter_caption',
      'hashtags', 'story_ideas', 'scheduled_date', 'scheduled_platform', 'status'
    ];
    
    const setClause = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        values.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
      }
    });
    
    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    dbOperations.run(`UPDATE content SET ${setClause.join(', ')} WHERE id = ?`, values);
    
    const updated = dbOperations.get('SELECT * FROM content WHERE id = ?', [id]);
    
    res.json({
      ...updated,
      imageUrl: `/uploads/${updated.image_filename}`,
      hashtags: JSON.parse(updated.hashtags || '[]'),
      story_ideas: JSON.parse(updated.story_ideas || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete content
router.delete('/:id', (req, res) => {
  try {
    const content = dbOperations.get('SELECT * FROM content WHERE id = ?', [req.params.id]);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Delete image file
    if (fs.existsSync(content.image_path)) {
      fs.unlinkSync(content.image_path);
    }
    
    // Delete from database
    dbOperations.run('DELETE FROM content WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get calendar view
router.get('/calendar/month', (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month required' });
    }
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const content = dbOperations.all(`
      SELECT * FROM content 
      WHERE scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `, [startDate, endDate]);
    
    res.json(content.map(item => ({
      ...item,
      imageUrl: `/uploads/${item.image_filename}`,
      hashtags: JSON.parse(item.hashtags || '[]')
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate more story ideas
router.post('/:id/story-ideas', async (req, res) => {
  try {
    const content = dbOperations.get('SELECT * FROM content WHERE id = ?', [req.params.id]);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const ideas = await generateStoryIdeas(content.event_type);
    
    dbOperations.run(
      'UPDATE content SET story_ideas = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(ideas), req.params.id]
    );
    
    res.json({ story_ideas: ideas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
