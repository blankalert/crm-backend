const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// 0. GET Single Layout (For Editing) - Must be before /:module
router.get('/detail/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM module_form_layouts WHERE id=$1 AND tenant_id=$2", [req.params.id, req.user.tenant_id]);
        if(result.rows.length === 0) return res.status(404).json({error: "Not found"});
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 1. GET all layouts for a module (Settings Page)
router.get('/:module', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM module_form_layouts WHERE tenant_id = $1 AND module_name = $2 ORDER BY is_active DESC, created_at DESC",
            [req.user.tenant_id, req.params.module]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. GET the ACTIVE layout for a module (Used by LeadForm)
router.get('/:module/active', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT layout_config FROM module_form_layouts WHERE tenant_id = $1 AND module_name = $2 AND is_active = true",
            [req.user.tenant_id, req.params.module]
        );
        
        // If no custom layout exists, return null (Frontend will fallback to default)
        if (result.rows.length === 0) return res.json(null);
        
        res.json(result.rows[0].layout_config);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. CREATE / UPDATE Layout
router.post('/', authenticateToken, async (req, res) => {
    const { module_name, layout_name, layout_config } = req.body;
    try {
        await pool.query(
            `INSERT INTO module_form_layouts (tenant_id, module_name, layout_name, layout_config, is_active)
             VALUES ($1, $2, $3, $4, false)`, // Default to inactive
            [req.user.tenant_id, module_name, layout_name, JSON.stringify(layout_config)]
        );
        res.json({ message: "Layout created" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3a. UPDATE Layout
router.put('/:id', authenticateToken, async (req, res) => {
    const { layout_name, layout_config } = req.body;
    try {
        await pool.query(
            "UPDATE module_form_layouts SET layout_name=$1, layout_config=$2 WHERE id=$3 AND tenant_id=$4",
            [layout_name, JSON.stringify(layout_config), req.params.id, req.user.tenant_id]
        );
        res.json({ message: "Layout updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3b. DELETE Layout
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM module_form_layouts WHERE id=$1 AND tenant_id=$2", [req.params.id, req.user.tenant_id]);
        res.json({ message: "Layout deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. ACTIVATE a Layout (The "Switch")
router.put('/:id/activate', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Get the module name of the target layout
        const target = await client.query("SELECT module_name FROM module_form_layouts WHERE id=$1 AND tenant_id=$2", [req.params.id, req.user.tenant_id]);
        if(target.rows.length === 0) throw new Error("Layout not found");
        const moduleName = target.rows[0].module_name;

        // 2. Deactivate ALL layouts for this module
        await client.query(
            "UPDATE module_form_layouts SET is_active = false WHERE tenant_id = $1 AND module_name = $2",
            [req.user.tenant_id, moduleName]
        );

        // 3. Activate the specific layout
        await client.query(
            "UPDATE module_form_layouts SET is_active = true WHERE id = $1",
            [req.params.id]
        );

        await client.query('COMMIT');
        res.json({ message: "Layout activated successfully" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// 5. DUPLICATE Layout
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM module_form_layouts WHERE id=$1 AND tenant_id=$2", [req.params.id, req.user.tenant_id]);
        if(result.rows.length === 0) return res.status(404).json({error: "Not found"});
        
        const original = result.rows[0];
        const newName = `Copy of ${original.layout_name}`;
        
        await pool.query(
            `INSERT INTO module_form_layouts (tenant_id, module_name, layout_name, layout_config, is_active)
             VALUES ($1, $2, $3, $4, false)`,
            [req.user.tenant_id, original.module_name, newName, JSON.stringify(original.layout_config)]
        );
        res.json({ message: "Layout duplicated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;