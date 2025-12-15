const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticateToken, checkPerm } = require('../middleware/authMiddleware');
const router = express.Router();

// GET ALL USERS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.gender, u.country_code, u.designation, u.department, u.teams, u.image, u.is_active, r.name as role_name, ur.role_id, u.is_owner
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      LEFT JOIN roles r ON ur.role_id = r.id 
      WHERE u.tenant_id = $1
      ORDER BY u.created_at DESC
    `, [req.user.tenant_id]);
    
    const formattedUsers = users.rows.map(u => ({ ...u, full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name' }));
    res.json(formattedUsers);
  } catch (err) { res.status(500).send("Error fetching users"); }
});

// CREATE USER
router.post('/create', authenticateToken, checkPerm('user:create'), async (req, res) => {
  const { email, password, first_name, last_name, gender, country_code, phone, designation, department, teams, image, role_id } = req.body;

  const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (emailCheck.rows.length > 0) return res.status(409).json({ message: "User with this email already exists." });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, gender, country_code, phone, designation, department, teams, image) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [req.user.tenant_id, email, hashedPassword, first_name, last_name, gender, country_code, phone, designation, department, teams, image]
    );
    
    if (role_id) await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [userRes.rows[0].id, role_id]);
    
    await client.query('COMMIT');
    res.json({ message: "User created" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).send("Error creating user");
  } finally { client.release(); }
});

// UPDATE USER
router.put('/:id', authenticateToken, checkPerm('user:update'), async (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, gender, country_code, phone, designation, department, teams, image, role_id } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            UPDATE users SET first_name = $1, last_name = $2, gender = $3, country_code = $4, phone = $5, designation = $6, department = $7, teams = $8, image = $9
            WHERE id = $10 AND tenant_id = $11
        `, [first_name, last_name, gender, country_code, phone, designation, department, teams, image, userId, req.user.tenant_id]);

        if (role_id) {
            await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
            await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [userId, role_id]);
        }
        await client.query('COMMIT');
        res.json({ message: "User updated successfully" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send("Error updating user");
    } finally { client.release(); }
});

// DELETE USER
router.delete('/:id', authenticateToken, checkPerm('user:delete'), async (req, res) => {
  const targetUserId = req.params.id;
  try {
    const targetUser = await pool.query("SELECT * FROM users WHERE id = $1 AND tenant_id = $2", [targetUserId, req.user.tenant_id]);
    if (targetUser.rows.length === 0) return res.status(404).json({ message: "User not found" });
    if (targetUser.rows[0].is_owner) return res.status(403).json({ message: "Cannot delete Company Owner." });

    await pool.query("DELETE FROM users WHERE id = $1", [targetUserId]);
    res.json({ message: "User deleted successfully" });
  } catch (err) { res.status(500).send("Server Error"); }
});

module.exports = router;