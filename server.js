require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Config
const pool = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const leadRoutes = require('./routes/leadRoutes'); // <--- ADDED THIS
const pipelineRoutes = require('./routes/pipelineRoutes');
const taskRoutes = require('./routes/taskRoutes');
const FormFieldRoutes = require('./routes/FormFieldRoutes');
const layoutRoutes = require('./routes/layoutRoutes');



const app = express();

app.use(cors());
app.use(express.json());

// --- MOUNT ROUTES ---
app.use('/api', authRoutes);           // Login, Register, Forgot Password
app.use('/api/users', userRoutes);     // User Management
app.use('/api/roles', roleRoutes);     // Roles & Permissions
app.use('/api/tenant', tenantRoutes);  // Company Profile
app.use('/api/dashboard', dashboardRoutes); // Stats
app.use('/api/leads', leadRoutes);     // <--- ADDED THIS (Fixes "Failed to create lead")
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/form-fields', FormFieldRoutes);
app.use('/api/layouts', layoutRoutes);

// Helper: Handle direct /api/permissions call by forwarding to roleRoutes
app.use('/api/permissions', (req, res, next) => {
    // Forward /api/permissions to roleRoutes /permissions
    req.url = '/permissions';
    roleRoutes(req, res, next);
});

// Start Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});