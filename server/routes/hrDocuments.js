const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const pool    = require('../db/pool');
const verify  = require('../middleware/auth');
const { isHRAdmin } = require('../utils/hrHelpers');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/hr-docs'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/hr/documents?category=company|employee
router.get('/', verify, async (req, res) => {
  const u = req.user;
  const cat = req.query.category; // 'company' | 'employee' | undefined
  const params = [u.id];
  const catFilter = cat ? `AND d.doc_category=$2` : '';
  if (cat) params.push(cat);

  // Non-HR-Admin: employee docs only visible if assigned to them
  const visibilityFilter = isHRAdmin(u)
    ? ''
    : `AND (d.doc_category='company' OR d.assigned_to=$${params.length + 1})`;
  if (!isHRAdmin(u)) params.push(u.id);

  try {
    const r = await pool.query(`
      SELECT d.*,
             u2.name AS created_by_name,
             ep.name AS assigned_to_name,
             (SELECT COUNT(*)::int FROM hr_document_acks a WHERE a.document_id=d.id) AS ack_count,
             EXISTS(SELECT 1 FROM hr_document_acks a WHERE a.document_id=d.id AND a.user_id=$1) AS acknowledged,
             (SELECT acknowledged_at FROM hr_document_acks a WHERE a.document_id=d.id AND a.user_id=$1) AS acknowledged_at
      FROM hr_documents d
      LEFT JOIN users u2 ON u2.id=d.created_by
      LEFT JOIN users ep ON ep.id=d.assigned_to
      WHERE 1=1 ${catFilter} ${visibilityFilter}
      ORDER BY d.created_at DESC
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/documents/file/:filename — authenticated file download (must be before /:id)
router.get('/file/:filename', verify, (req, res) => {
  const fp = path.join(__dirname, '../uploads/hr-docs', path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
  res.download(fp);
});

// POST /api/hr/documents — multipart/form-data
router.post('/', verify, upload.single('file'), async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { title, description, version, is_mandatory, doc_category, assigned_to, body } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const cat = doc_category || 'company';
  try {
    const r = await pool.query(`
      INSERT INTO hr_documents
        (title, description, version, is_mandatory, body, doc_category, assigned_to, file_path, file_name, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      title,
      description || null,
      version || '1.0',
      is_mandatory === 'true' || is_mandatory === true,
      body || null,
      cat,
      (cat === 'employee' && assigned_to) ? assigned_to : null,
      req.file ? req.file.filename : null,
      req.file ? req.file.originalname : null,
      req.user.id,
    ]);
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/hr/documents/:id
router.put('/:id', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { title, description, version, is_mandatory, body } = req.body;
  try {
    const r = await pool.query(`
      UPDATE hr_documents
      SET title=COALESCE($1,title), description=COALESCE($2,description),
          version=COALESCE($3,version), is_mandatory=COALESCE($4,is_mandatory),
          body=COALESCE($5,body), updated_at=NOW()
      WHERE id=$6 RETURNING *
    `, [title||null, description||null, version||null, is_mandatory??null, body||null, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/hr/documents/:id
router.delete('/:id', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await pool.query('DELETE FROM hr_documents WHERE id=$1 RETURNING file_path', [req.params.id]);
    if (r.rows[0]?.file_path) {
      fs.unlink(path.join(__dirname, '../uploads/hr-docs', r.rows[0].file_path), () => {});
    }
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/hr/documents/:id/acknowledge
router.post('/:id/acknowledge', verify, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO hr_document_acks (document_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/documents/:id/acknowledgements — HR Admin only, who has/hasn't read
router.get('/:id/acknowledgements', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await pool.query(`
      SELECT u.id, u.name, u.color, u.hr_role, da.acknowledged_at
      FROM users u
      LEFT JOIN hr_document_acks da ON da.document_id=$1 AND da.user_id=u.id
      WHERE u.hr_role IS NOT NULL
      ORDER BY u.name
    `, [req.params.id]);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
