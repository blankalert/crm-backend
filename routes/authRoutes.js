const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const router = express.Router();

// REGISTER COMPANY
router.post('/register-company', async (req, res) => {
  const { company_name, email, password, first_name, last_name, phone } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Global Email Check
    const emailCheck = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: "This email is already registered." });
    }

    const tenantRes = await client.query(`INSERT INTO tenants (company_name, contact_email) VALUES ($1, $2) RETURNING id`, [company_name, email]);
    const tenantId = tenantRes.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, is_owner) 
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [tenantId, email, hashedPassword, first_name, last_name, phone]
    );
    const userId = userRes.rows[0].id;

    const roleRes = await client.query(`INSERT INTO roles (tenant_id, name, description) VALUES ($1, 'Super Admin', 'Owner') RETURNING id`, [tenantId]);
    const roleId = roleRes.rows[0].id;

    const allPerms = await client.query('SELECT id FROM permissions');
    for (let perm of allPerms.rows) {
      await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, [roleId, perm.id]);
    }

    await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [userId, roleId]);

    await client.query('COMMIT');
    res.json({ message: "Registered successfully!", tenantId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send("Registration Failed");
  } finally {
    client.release();
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(401).json({ message: "Invalid Credential" });

    // --- NEW SECURITY CHECK: Is Company Active? ---
    const tenantCheck = await pool.query("SELECT is_active FROM tenants WHERE id = $1", [user.rows[0].tenant_id]);
    
    // If tenant does not exist or is deactivated
    if (tenantCheck.rows.length === 0 || !tenantCheck.rows[0].is_active) {
        return res.status(403).json({ message: "Your company account is deactivated. Please contact support." });
    }
    // ----------------------------------------------

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ message: "Invalid Credential" });

    const sessionId = crypto.randomBytes(16).toString('hex');
    await pool.query("UPDATE users SET session_id = $1, last_login_at = NOW() WHERE id = $2", [sessionId, user.rows[0].id]);

    const token = jwt.sign(
      { user_id: user.rows[0].id, tenant_id: user.rows[0].tenant_id, session_id: sessionId },
      process.env.JWT_SECRET, { expiresIn: "12h" }
    );
    
    res.json({ token, user: { name: user.rows[0].first_name } });

  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).send("Server Error");
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); 

    await pool.query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3", [token, expiry, email]);

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    console.log(`[EMAIL SIMULATION] Reset Link: ${resetLink}`);

    res.json({ message: "Reset link sent (Check Console)" });
  } catch (err) { res.status(500).send("Server Error"); }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()", [token]);
    if (user.rows.length === 0) return res.status(400).json({ message: "Invalid or Expired Token" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [hashedPassword, user.rows[0].id]);
    res.json({ message: "Password reset successfully" });
  } catch (err) { res.status(500).send("Server Error"); }
});

module.exports = router;