const router = require('express').Router();
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

const DONE_STATUSES = ['done', 'delivered', 'approved'];

// Verify the user can access the project the item belongs to (owner or creator)
async function checkItemAccess(itemId, userId) {
  const { rows } = await pool.query(
    `SELECT pi.id, p.owner_id, p.created_by
     FROM project_items pi JOIN projects p ON p.id = pi.project_id
     WHERE pi.id = $1`,
    [itemId]
  );
  if (!rows[0]) return { status: 404, error: 'Item not found' };
  if (rows[0].owner_id !== userId && rows[0].created_by !== userId)
    return { status: 403, error: 'Forbidden' };
  return {};
}

// POST /api/daily-focus  { item_id } — pin an item for today
router.post('/', verifyJWT, async (req, res) => {
  const { item_id } = req.body;
  if (!item_id) return res.status(400).json({ error: 'item_id required' });
  try {
    const access = await checkItemAccess(item_id, req.user.id);
    if (access.status) return res.status(access.status).json({ error: access.error });

    const { rows: [{ next_pos }] } = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
       FROM daily_focus WHERE user_id = $1 AND focus_date = CURRENT_DATE`,
      [req.user.id]
    );
    await pool.query(
      `INSERT INTO daily_focus (user_id, item_id, focus_date, position)
       VALUES ($1, $2, CURRENT_DATE, $3)
       ON CONFLICT (user_id, item_id, focus_date) DO NOTHING`,
      [req.user.id, item_id, next_pos]
    );
    res.status(201).json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/daily-focus/:itemId — unpin an item for today
router.delete('/:itemId', verifyJWT, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM daily_focus WHERE user_id = $1 AND item_id = $2 AND focus_date = CURRENT_DATE`,
      [req.user.id, req.params.itemId]
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/daily-focus/carryover — most recent previous day's pins whose items are still open
router.get('/carryover', verifyJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT df.item_id, df.focus_date, pi.title,
              p.title AS project_title, p.color AS project_color
       FROM daily_focus df
       JOIN project_items pi ON pi.id = df.item_id
       JOIN projects p ON p.id = pi.project_id
       WHERE df.user_id = $1
         AND df.focus_date = (
           SELECT MAX(focus_date) FROM daily_focus
           WHERE user_id = $1 AND focus_date < CURRENT_DATE
         )
         AND pi.status NOT IN ('done','delivered','approved')
         AND p.status = 'active'
         AND df.item_id NOT IN (
           SELECT item_id FROM daily_focus WHERE user_id = $1 AND focus_date = CURRENT_DATE
         )
       ORDER BY df.position ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/daily-focus/carryover — re-pin all carryover items for today
router.post('/carryover', verifyJWT, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO daily_focus (user_id, item_id, focus_date, position)
       SELECT df.user_id, df.item_id, CURRENT_DATE, df.position
       FROM daily_focus df
       JOIN project_items pi ON pi.id = df.item_id
       JOIN projects p ON p.id = pi.project_id
       WHERE df.user_id = $1
         AND df.focus_date = (
           SELECT MAX(focus_date) FROM daily_focus
           WHERE user_id = $1 AND focus_date < CURRENT_DATE
         )
         AND pi.status NOT IN ('done','delivered','approved')
         AND p.status = 'active'
       ON CONFLICT (user_id, item_id, focus_date) DO NOTHING`,
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
