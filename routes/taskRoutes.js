const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET ALL TASKS (with filtering)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { related_to_module, related_to_id, owner_id, status } = req.query;
        let query = `
            SELECT t.*, u.first_name as owner_name
            FROM tasks t
            LEFT JOIN users u ON t.owner_id = u.id
            WHERE t.tenant_id = $1
        `;
        const params = [req.user.tenant_id];
        let paramIndex = 2;

        if (related_to_module) {
            query += ` AND t.related_to_module = $${paramIndex++}`;
            params.push(related_to_module);
        }
        if (related_to_id) {
            query += ` AND t.related_to_id = $${paramIndex++}`;
            params.push(related_to_id);
        }
        if (owner_id) {
            query += ` AND t.owner_id = $${paramIndex++}`;
            params.push(owner_id);
        }
        if (status) {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }

        query += ` ORDER BY t.due_date ASC, t.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching tasks");
    }
});

// CREATE A NEW TASK
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { task_name, task_type, description, status, priority, due_date, reminder_date, owner_id, related_to_module, related_to_id } = req.body;
        const { tenant_id, user_id } = req.user;

        const result = await pool.query(
            `INSERT INTO tasks (tenant_id, task_name, task_type, description, status, priority, due_date, reminder_date, owner_id, related_to_module, related_to_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [tenant_id, task_name, task_type, description, status || 'Open', priority, due_date, reminder_date, owner_id, related_to_module, related_to_id, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating task");
    }
});

// UPDATE A TASK
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { task_name, task_type, description, status, priority, due_date, reminder_date, owner_id } = req.body;
        const { tenant_id, user_id } = req.user;

        // Handle setting completed_at timestamp
        let completed_at = null;
        if (status === 'Completed') {
            const currentTask = await pool.query('SELECT status FROM tasks WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
            if (currentTask.rows.length > 0 && currentTask.rows[0].status !== 'Completed') {
                completed_at = new Date();
            }
        }

        const result = await pool.query(
            `UPDATE tasks SET 
                task_name = $1, task_type = $2, description = $3, status = $4, priority = $5, 
                due_date = $6, reminder_date = $7, owner_id = $8, updated_at = NOW(), updated_by = $9,
                completed_at = COALESCE($10, completed_at)
             WHERE id = $11 AND tenant_id = $12
             RETURNING *`,
            [task_name, task_type, description, status, priority, due_date, reminder_date, owner_id, user_id, completed_at, id, tenant_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Task not found or permission denied");
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating task");
    }
});

// DELETE A TASK
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { tenant_id } = req.user;

        const result = await pool.query(
            "DELETE FROM tasks WHERE id = $1 AND tenant_id = $2",
            [id, tenant_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Task not found or permission denied");
        }
        res.status(204).send(); // No Content
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting task");
    }
});

module.exports = router;