const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const pool    = require('../db/pool');
const verify  = require('../middleware/auth');
const { isHRAdmin } = require('../utils/hrHelpers');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/payroll'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/hr/payroll/slips?userId=&year=
router.get('/slips', verify, async (req, res) => {
  const u = req.user;
  const tid = req.query.userId || u.id;
  if (tid !== u.id && !isHRAdmin(u)) return res.status(403).json({ error: 'Forbidden' });
  const params = [tid];
  let where = 'WHERE sl.user_id=$1';
  if (req.query.year) { where += ` AND sl.month LIKE $2`; params.push(`${req.query.year}-%`); }
  try {
    const r = await pool.query(`
      SELECT sl.*, gb.name AS generated_by_name, emp.name AS employee_name, emp.color AS employee_color
      FROM salary_slips sl
      LEFT JOIN users gb  ON gb.id  = sl.generated_by
      LEFT JOIN users emp ON emp.id = sl.user_id
      ${where}
      ORDER BY sl.month DESC
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/payroll/slips/all?year= — HR Admin: all employees' slips
router.get('/slips/all', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const params = [];
  let where = '';
  if (req.query.year) { params.push(`${req.query.year}-%`); where = `WHERE sl.month LIKE $1`; }
  try {
    const r = await pool.query(`
      SELECT sl.*, gb.name AS generated_by_name, emp.name AS employee_name, emp.color AS employee_color
      FROM salary_slips sl
      LEFT JOIN users gb  ON gb.id  = sl.generated_by
      LEFT JOIN users emp ON emp.id = sl.user_id
      ${where}
      ORDER BY sl.month DESC, emp.name
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/payroll/file/:filename — authenticated salary slip download
router.get('/file/:filename', verify, (req, res) => {
  const fp = path.join(__dirname, '../uploads/payroll', path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
  res.download(fp);
});

// POST /api/hr/payroll/slips — multipart upload (file required)
router.post('/slips', verify, upload.single('file'), async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { user_id, month } = req.body;
  if (!user_id || !month) return res.status(400).json({ error: 'user_id and month required' });
  if (!req.file) return res.status(400).json({ error: 'file required' });
  try {
    // Delete old file if replacing
    const old = await pool.query('SELECT file_path FROM salary_slips WHERE user_id=$1 AND month=$2', [user_id, month]);
    if (old.rows[0]?.file_path) {
      fs.unlink(path.join(__dirname, '../uploads/payroll', old.rows[0].file_path), () => {});
    }
    const r = await pool.query(`
      INSERT INTO salary_slips (user_id, month, gross, deductions, net, components, file_path, file_name, generated_by)
      VALUES ($1,$2,0,'{}',0,'{}', $3,$4,$5)
      ON CONFLICT (user_id, month) DO UPDATE
        SET file_path=$3, file_name=$4, generated_by=$5, generated_at=NOW()
      RETURNING *
    `, [user_id, month, req.file.filename, req.file.originalname, req.user.id]);
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/hr/payroll/slips/:id — HR Admin only
router.delete('/slips/:id', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await pool.query('DELETE FROM salary_slips WHERE id=$1 RETURNING file_path', [req.params.id]);
    if (r.rows[0]?.file_path) {
      fs.unlink(path.join(__dirname, '../uploads/payroll', r.rows[0].file_path), () => {});
    }
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
