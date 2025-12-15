const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;

    const tenantRes = await pool.query("SELECT company_name FROM tenants WHERE id = $1", [tenantId]);
    const companyName = tenantRes.rows[0]?.company_name || "CRM System";

    const userRes = await pool.query(`
        SELECT u.first_name, u.last_name, r.name as role_name 
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id 
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE u.id = $1
    `, [userId]);
    
    const user = userRes.rows[0];

    res.json({
      company_name: companyName,
      user: {
          full_name: `${user.first_name} ${user.last_name}`,
          first_name: user.first_name,
          role: user.role_name || 'Staff'
      },
      stats: { active_leads: 12, pending_orders: 5 }
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;