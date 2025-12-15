const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// --- 1. VERIFY TOKEN & SESSION ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  
  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // A. SINGLE SESSION CHECK
    const userCheck = await pool.query("SELECT session_id FROM users WHERE id = $1", [verified.user_id]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].session_id !== verified.session_id) {
        return res.status(401).json({ message: "Session expired. You have logged in from another device." });
    }

    // B. TENANT STATUS CHECK
    const tenantCheck = await pool.query("SELECT is_active FROM tenants WHERE id = $1", [verified.tenant_id]);
    if (tenantCheck.rows.length === 0 || tenantCheck.rows[0].is_active === false) {
        return res.status(403).json({ message: "ACCOUNT DEACTIVATED: Please contact support." });
    }

    req.user = verified; 
    next(); 
  } catch (err) {
    res.status(403).json({ message: "Invalid or Expired Token" });
  }
};

// --- 2. PERMISSION CHECKER ---
const checkPerm = (requiredPerm) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id; 

      // Owners bypass checks
      const userCheck = await pool.query("SELECT is_owner FROM users WHERE id = $1", [userId]);
      if (userCheck.rows[0]?.is_owner) return next();

      // Check Permissions
      const result = await pool.query(`
        SELECT p.slug FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1
      `, [userId]);

      const userPermissions = result.rows.map(row => row.slug);
      
      if (userPermissions.includes(requiredPerm)) {
        next(); 
      } else {
        res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
      }

    } catch (err) {
      console.error("Permission Check Error:", err);
      res.status(500).send("Authorization Error");
    }
  };
};

module.exports = { authenticateToken, checkPerm };