require('dotenv').config();
const express = require('express');
const cors = require('cors');

const brRoutes = require('./routes/br');
const intRoutes = require('./routes/int');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/br', brRoutes);
app.use('/api/int', intRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
