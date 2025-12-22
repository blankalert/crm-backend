const express = require('express');
const pool = require('../config/db');
const { authenticateToken, checkPerm } = require('../middleware/authMiddleware');
const router = express.Router();

// GET ALL PIPELINES FOR TENANT
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { module } = req.query;
        let query = `
            SELECT p.*, 
            COALESCE((SELECT json_agg(s.* ORDER BY s.stage_order) FROM pipeline_stages s WHERE s.pipeline_id = p.id), '[]'::json) as stages,
            COALESCE((SELECT json_agg(e.* ORDER BY e.reason_order) FROM exit_reasons e WHERE e.pipeline_id = p.id), '[]'::json) as exit_reasons
            FROM pipelines p
            WHERE p.tenant_id = $1
        `;
        const params = [req.user.tenant_id];

        if (module) {
            query += ` AND p.module = $2`;
            params.push(module);
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Error fetching pipelines");
    }
});

// CREATE / UPDATE PIPELINE (Full Transaction)
router.post('/', authenticateToken, checkPerm('settings:update'), async (req, res) => {
    const { id, pipeline_name, module, is_active, stages, exit_reasons } = req.body;
    const tenant_id = req.user.tenant_id;
    const user_id = req.user.user_id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let pipelineId = id;

        if (id) {
            // Update Existing
            await client.query(`
                UPDATE pipelines SET pipeline_name=$1, module=$2, is_active=$3, updated_at=NOW() 
                WHERE id=$4 AND tenant_id=$5
            `, [pipeline_name, module, is_active, id, tenant_id]);
            
            // Delete old stages/reasons to re-insert (simplest sync strategy)
            await client.query("DELETE FROM pipeline_stages WHERE pipeline_id=$1", [id]);
            await client.query("DELETE FROM exit_reasons WHERE pipeline_id=$1", [id]);
        } else {
            // Create New
            const res = await client.query(`
                INSERT INTO pipelines (tenant_id, pipeline_name, module, is_active, created_by)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [tenant_id, pipeline_name, module, is_active || true, user_id]);
            pipelineId = res.rows[0].id;
        }

        // Insert Stages
        if (stages && stages.length > 0) {
            let order = 1;
            for (const st of stages) {
                await client.query(`
                    INSERT INTO pipeline_stages (pipeline_id, name, win_likelihood, description, stage_order)
                    VALUES ($1, $2, $3, $4, $5)
                `, [pipelineId, st.name, st.win_likelihood || 0, st.description, order++]);
            }
        }

        // Insert Exit Reasons
        if (exit_reasons && exit_reasons.length > 0) {
            let order = 1;
            for (const er of exit_reasons) {
                await client.query(`
                    INSERT INTO exit_reasons (pipeline_id, reason_type, description, reason_order)
                    VALUES ($1, $2, $3, $4)
                `, [pipelineId, er.reason_type, er.description, order++]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: "Pipeline Saved", id: pipelineId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send("Error saving pipeline");
    } finally {
        client.release();
    }
});

// DELETE PIPELINE
router.delete('/:id', authenticateToken, checkPerm('settings:update'), async (req, res) => {
    try {
        // Prevent deleting default pipeline if logic exists
        await pool.query("DELETE FROM pipelines WHERE id=$1 AND tenant_id=$2", [req.params.id, req.user.tenant_id]);
        res.json({ message: "Pipeline Deleted" });
    } catch (err) {
        res.status(500).send("Error deleting pipeline");
    }
});

module.exports = router;