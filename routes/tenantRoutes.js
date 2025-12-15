const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
    const tenant = await pool.query("SELECT * FROM tenants WHERE id = $1", [req.user.tenant_id]);
    res.json(tenant.rows[0]);
});

// UPDATE PROFILE
router.put('/profile', authenticateToken, async (req, res) => {
    const userCheck = await pool.query("SELECT is_owner FROM users WHERE id = $1", [req.user.user_id]);
    if (!userCheck.rows[0]?.is_owner) return res.status(403).json({ message: "Only Owner can update profile" });

    const { industry, employee_count, website, comp_email, comp_phone, address, city, state, zipcode, country, brand_name, comp_logo, gstin } = req.body;
    await pool.query(`
        UPDATE tenants SET 
            industry=$1, employee_count=$2, website=$3, comp_email=$4, comp_phone=$5,
            address=$6, city=$7, state=$8, zipcode=$9, country=$10, brand_name=$11, comp_logo=$12, gstin=$13
        WHERE id = $14
    `, [industry, employee_count, website, comp_email, comp_phone, address, city, state, zipcode, country, brand_name, comp_logo, gstin, req.user.tenant_id]);
    res.json({ message: "Company Profile Updated" });
});

// DEACTIVATE
router.post('/deactivate', authenticateToken, async (req, res) => {
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.user_id]);
    if (!userRes.rows[0].is_owner) return res.status(403).json({ message: "Only Owner can deactivate" });

    const validPassword = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ message: "Incorrect Password" });

    await pool.query("UPDATE tenants SET is_active = FALSE WHERE id = $1", [req.user.tenant_id]);
    res.json({ message: "ACCOUNT DEACTIVATED" });
});

module.exports = router;