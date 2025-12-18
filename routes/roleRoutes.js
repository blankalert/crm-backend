const express = require('express');
const pool = require('../config/db');
const { authenticateToken, checkPerm } = require('../middleware/authMiddleware');
const router = express.Router();

// LIST PERMISSIONS
// Accessible at /api/permissions (via server.js rewrite) or /api/roles/permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const perms = await pool.query("SELECT * FROM permissions ORDER BY slug");
    res.json(perms.rows);
  } catch (err) {
    console.error("Error fetching permissions:", err);
    res.status(500).json({ message: "Error fetching permissions" });
  }
});

// LIST ROLES
// Accessible at /api/roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = await pool.query(`
      SELECT r.id, r.name, 
             COALESCE(
                json_agg(p.slug) FILTER (WHERE p.slug IS NOT NULL), 
                '[]'::json
             ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.tenant_id = $1
      GROUP BY r.id
      ORDER BY r.name
    `, [req.user.tenant_id]);
    
    res.json(roles.rows);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ message: "Error fetching roles" });
  }
});

// CREATE ROLE
router.post('/', authenticateToken, checkPerm('settings:update'), async (req, res) => {
  const { name, permissionIds } = req.body; 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const roleRes = await client.query(`INSERT INTO roles (tenant_id, name) VALUES ($1, $2) RETURNING id`, [req.user.tenant_id, name]);
    const newRoleId = roleRes.rows[0].id;
    
    if (permissionIds && permissionIds.length > 0) {
      for (const permId of permissionIds) {
        await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, [newRoleId, permId]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: "Role Created", roleId: newRoleId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Failed to create role" });
  } finally { client.release(); }
});

// UPDATE ROLE
router.put('/:id', authenticateToken, checkPerm('settings:update'), async (req, res) => {
  const roleId = req.params.id;
  const { name, permissionIds } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const check = await client.query("SELECT * FROM roles WHERE id = $1 AND tenant_id = $2", [roleId, req.user.tenant_id]);
    if (check.rows.length === 0) throw new Error("Role not found");

    if (name) await client.query("UPDATE roles SET name = $1 WHERE id = $2", [name, roleId]);
    
    if (permissionIds) {
        await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);
        if (permissionIds.length > 0) {
            for (const permId of permissionIds) {
                await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, [roleId, permId]);
            }
        }
    }
    await client.query('COMMIT');
    res.json({ message: "Role updated" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error updating role:", err);
    res.status(500).json({ message: "Update failed" });
  } finally { client.release(); }
});

// DELETE ROLE
router.delete('/:id', authenticateToken, checkPerm('settings:update'), async (req, res) => {
  try {
    const check = await pool.query("SELECT * FROM roles WHERE id = $1 AND tenant_id = $2", [req.params.id, req.user.tenant_id]);
    if (check.rows.length === 0) return res.status(404).json({ message: "Role not found" });
    if (check.rows[0].name === 'Super Admin') return res.status(403).json({ message: "Cannot delete Super Admin" });

    await pool.query("DELETE FROM roles WHERE id = $1", [req.params.id]);
    res.json({ message: "Role deleted" });
  } catch (err) { 
    console.error("Error deleting role:", err);
    res.status(500).send("Error deleting role"); 
  }
});

module.exports = router;