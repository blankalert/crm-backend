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

// UPDATE LEAD (Full Edit)
router.put('/:id', authenticateToken, checkPerm('lead:update'), async (req, res) => {
  const leadId = req.params.id;
  const { 
      name, lead_date, category, lead_message, remark, source, status, pipeline,
      req_amount, lead_type, priority, company_name, owner,
      city, state, company_email, company_phone,
      phones, emails, address
  } = req.body;

  const tenant_id = req.user.tenant_id;
  const assignedOwner = owner === "" ? null : owner;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
        UPDATE leads SET 
            title=$1, lead_date=$2, category=$3, lead_message=$4, remark=$5, source=$6, 
            status=$7, pipeline=$8, req_amount=$9, lead_type=$10, priority=$11, 
            company_name=$12, owner=$13, city=$14, state=$15, 
            company_email=$16, company_phone=$17
        WHERE id=$18 AND tenant_id=$19
    `, [
        name, lead_date, category, lead_message, remark, source, status, pipeline,
        req_amount, lead_type, priority, company_name, assignedOwner, city, state,
        company_email, company_phone, leadId, tenant_id
    ]);

    // Update Related (Delete All -> Re-Insert strategy for simplicity)
    // Only perform this if phones/emails/address are actually passed in the body
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