const express = require('express');
const cors = require('cors');
const appointmentsRoutes = require('./routes/appointments');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/appointments', appointmentsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));