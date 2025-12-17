const express = require('express');
const pool = require('../config/db');
const { authenticateToken, checkPerm } = require('../middleware/authMiddleware');
const router = express.Router();

// GET ALL LEADS (List View)
router.get('/', authenticateToken, checkPerm('lead:read'), async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const result = await pool.query(`
      SELECT l.*, u.first_name as agent_name, u.image as agent_image
      FROM leads l
      LEFT JOIN users u ON l.owner = u.id
      WHERE l.tenant_id = $1 AND l.is_delete = FALSE
      ORDER BY l.created_at DESC
    `, [tenant_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching leads");
  }
});

// GET SINGLE LEAD (Detail View - with all related data)
router.get('/:id', authenticateToken, checkPerm('lead:read'), async (req, res) => {
  const leadId = req.params.id;
  const tenant_id = req.user.tenant_id;
  try {
    const leadRes = await pool.query(`
      SELECT l.*, u.first_name as agent_name, u.last_name as agent_last_name, u.image as agent_image,
      (SELECT json_agg(json_build_object('number', phone_number, 'type', type)) FROM lead_phones WHERE lead_id = l.id) as phones,
      (SELECT json_agg(json_build_object('email', email, 'type', type)) FROM lead_emails WHERE lead_id = l.id) as emails,
      (SELECT row_to_json(la) FROM lead_addresses la WHERE lead_id = l.id LIMIT 1) as address
      FROM leads l
      LEFT JOIN users u ON l.owner = u.id
      WHERE l.id = $1 AND l.tenant_id = $2
    `, [leadId, tenant_id]);

    if (leadRes.rows.length === 0) return res.status(404).json({ message: "Lead not found" });
    res.json(leadRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching lead details");
  }
});

// CREATE LEAD
router.post('/', authenticateToken, checkPerm('lead:create'), async (req, res) => {
  const { 
      name, lead_date, category, lead_message, remark, source, status, pipeline,
      req_amount, lead_type, priority, company_name, owner,
      city, state, company_email, company_phone,
      phones, emails, address
  } = req.body;

  const tenant_id = req.user.tenant_id;
  const created_by = req.user.user_id;
  const assignedOwner = owner === "" ? null : owner;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const leadRes = await client.query(`
      INSERT INTO leads 
      (tenant_id, title, lead_date, category, lead_message, remark, source, status, pipeline,
       req_amount, lead_type, priority, company_name, owner, created_by,
       city, state, company_email, company_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `, [
        tenant_id, name, lead_date, category, lead_message, remark, source, status, pipeline || 'Standard',
        req_amount || 0, lead_type, priority, company_name, assignedOwner, created_by,
        city, state, company_email, company_phone
    ]);
    const leadId = leadRes.rows[0].id;

    if (phones?.length) {
        for (const p of phones) await client.query(`INSERT INTO lead_phones (lead_id, phone_number, type) VALUES ($1, $2, $3)`, [leadId, p.number, p.type]);
    }
    if (emails?.length) {
        for (const e of emails) await client.query(`INSERT INTO lead_emails (lead_id, email, type) VALUES ($1, $2, $3)`, [leadId, e.email, e.type]);
    }
    if (address && (address.line || address.city)) {
        await client.query(`INSERT INTO lead_addresses (lead_id, address_line, city, state, zipcode) VALUES ($1, $2, $3, $4, $5)`, [leadId, address.line, address.city, address.state, address.zipcode]);
    }

    await client.query('COMMIT');
    res.json({ message: "Lead Created" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send("Error creating lead");
  } finally { client.release(); }
});

// UPDATE LEAD (Dynamic - Handles Status, Closure, and Full Edits)
router.put('/:id', authenticateToken, checkPerm('lead:update'), async (req, res) => {
  const leadId = req.params.id;
  const tenant_id = req.user.tenant_id;
  
  const { 
      name, // Maps to title
      lead_date, category, lead_message, remark, source, status, pipeline,
      req_amount, lead_type, priority, company_name, owner,
      city, state, company_email, company_phone,
      phones, emails, address,
      closed_reason, closed_time
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Build Dynamic SQL for Main Table
    // We only update fields that are actually sent.
    let updateFields = [];
    let values = [];
    let idx = 1;

    const addField = (col, val) => {
        updateFields.push(`${col} = $${idx++}`);
        values.push(val);
    };

    if (name !== undefined) addField('title', name);
    if (lead_date !== undefined) addField('lead_date', lead_date);
    if (category !== undefined) addField('category', category);
    if (lead_message !== undefined) addField('lead_message', lead_message);
    if (remark !== undefined) addField('remark', remark);
    if (source !== undefined) addField('source', source);
    if (status !== undefined) addField('status', status);
    if (pipeline !== undefined) addField('pipeline', pipeline);
    if (req_amount !== undefined) addField('req_amount', req_amount);
    if (lead_type !== undefined) addField('lead_type', lead_type);
    if (priority !== undefined) addField('priority', priority);
    if (company_name !== undefined) addField('company_name', company_name);
    if (owner !== undefined) addField('owner', owner === "" ? null : owner);
    if (city !== undefined) addField('city', city);
    if (state !== undefined) addField('state', state);
    if (company_email !== undefined) addField('company_email', company_email);
    if (company_phone !== undefined) addField('company_phone', company_phone);
    if (closed_reason !== undefined) addField('closed_reason', closed_reason);
    if (closed_time !== undefined) addField('closed_time', closed_time);
    
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length > 0) {
        const query = `UPDATE leads SET ${updateFields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1}`;
        values.push(leadId, tenant_id);
        await client.query(query, values);
    }

    // 2. Update Related Tables (Only if arrays are provided)
    if (phones) {
        await client.query("DELETE FROM lead_phones WHERE lead_id = $1", [leadId]);
        for (const p of phones) await client.query(`INSERT INTO lead_phones (lead_id, phone_number, type) VALUES ($1, $2, $3)`, [leadId, p.number, p.type]);
    }

    if (emails) {
        await client.query("DELETE FROM lead_emails WHERE lead_id = $1", [leadId]);
        for (const e of emails) await client.query(`INSERT INTO lead_emails (lead_id, email, type) VALUES ($1, $2, $3)`, [leadId, e.email, e.type]);
    }

    if (address) {
        await client.query("DELETE FROM lead_addresses WHERE lead_id = $1", [leadId]);
        if (address.line || address.city) {
            await client.query(`INSERT INTO lead_addresses (lead_id, address_line, city, state, zipcode) VALUES ($1, $2, $3, $4, $5)`, [leadId, address.line, address.city, address.state, address.zipcode]);
        }
    }

    await client.query('COMMIT');
    res.json({ message: "Lead Updated" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send("Error updating lead");
  } finally { client.release(); }
});

// DELETE LEAD
router.delete('/:id', authenticateToken, checkPerm('lead:delete'), async (req, res) => {
  try {
    await pool.query("UPDATE leads SET is_delete = TRUE WHERE id = $1 AND tenant_id = $2", [req.params.id, req.user.tenant_id]);
    res.json({ message: "Lead Deleted" });
  } catch (err) {
    res.status(500).send("Error deleting lead");
  }
});

module.exports = router;