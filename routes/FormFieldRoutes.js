const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// 1. GET Fields for a specific module (e.g., 'leads', 'tasks')
router.get('/fields/:module', authenticateToken, async (req, res) => {
    try {
        const { module } = req.params;
        const result = await pool.query(
            `SELECT * FROM module_field_configs 
             WHERE tenant_id = $1 AND module_name = $2 
             ORDER BY order_index ASC, created_at ASC`,
            [req.user.tenant_id, module]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching fields" });
    }
});

// 2. CREATE a New Custom Field
router.post('/fields', authenticateToken, async (req, res) => {
    const { module_name, field_label, field_type, options, is_required } = req.body;
    
    // Auto-generate safe key (e.g. "Spouse Name" -> "cf_spouse_name")
    const field_key = 'cf_' + field_label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
        await pool.query(
            `INSERT INTO module_field_configs 
            (tenant_id, module_name, field_key, field_label, field_type, is_system, options, is_required)
            VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)`,
            [req.user.tenant_id, module_name, field_key, field_label, field_type, JSON.stringify(options || []), is_required]
        );
        res.json({ message: "Field created successfully" });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: "A field with this name already exists." });
        }
        res.status(500).json({ error: "Server error creating field" });
    }
});

// 3. UPDATE a Field (Hide, Rename, Change Options)
router.put('/fields/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { field_label, is_hidden, is_required, options, order_index } = req.body;

    try {
        // Fetch field first to check if it is system
        const check = await pool.query("SELECT is_system FROM module_field_configs WHERE id = $1 AND tenant_id = $2", [id, req.user.tenant_id]);
        
        if (check.rows.length === 0) return res.status(404).json({ error: "Field not found" });
        const isSystem = check.rows[0].is_system;

        // Construct Query dynamically
        // Note: We typically don't allow changing 'field_type' for existing fields to avoid breaking data
        await pool.query(
            `UPDATE module_field_configs 
             SET field_label = $1, 
                 is_hidden = $2, 
                 is_required = $3, 
                 options = $4,
                 order_index = COALESCE($5, order_index)
             WHERE id = $6 AND tenant_id = $7`,
            [field_label, is_hidden, is_required, JSON.stringify(options || []), order_index, id, req.user.tenant_id]
        );

        res.json({ message: "Field updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error updating field" });
    }
});

// 4. DELETE a Custom Field
router.delete('/fields/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting System Fields
        const check = await pool.query("SELECT is_system FROM module_field_configs WHERE id = $1 AND tenant_id = $2", [id, req.user.tenant_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Field not found" });
        
        if (check.rows[0].is_system) {
            return res.status(403).json({ error: "System fields cannot be deleted. Try hiding it instead." });
        }

        await pool.query("DELETE FROM module_field_configs WHERE id = $1 AND tenant_id = $2", [id, req.user.tenant_id]);
        res.json({ message: "Field deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error deleting field" });
    }
});

module.exports = router;