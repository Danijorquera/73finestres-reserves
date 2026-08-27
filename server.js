const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connexió directa a Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:[Bimba0217!!]@db.kkqlxcnnrcriqbxmsjpc.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

// Ruta per veure taules ocupades
app.get('/api/reservations', async (req, res) => {
    const { date, shift } = req.query;
    try {
        const query = `SELECT table_id FROM reservations WHERE reservation_date = $1 AND shift_type = $2`;
        const result = await pool.query(query, [date, shift]);
        const occupiedIds = result.rows.map(row => row.table_id);
        res.json(occupiedIds);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en consultar la disponibilitat" });
    }
});

// Ruta per crear una reserva nova
app.post('/api/reservations', async (req, res) => {
    const { table_id, date, shift, pax, customer_name, customer_phone } = req.body;
    try {
        const query = `
            INSERT INTO reservations (table_id, reservation_date, shift_type, pax, customer_name, customer_phone)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;
        const values = [table_id, date, shift, pax, customer_name, customer_phone];
        const result = await pool.query(query, values);
        res.status(201).json({ message: "Reserva confirmada", reservationId: result.rows[0].id });
    } catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ error: "Ho sentim, aquesta taula s'ha reservat just ara per un altre client." });
        } else {
            console.error(err);
            res.status(500).json({ error: "Error en processar la reserva" });
        }
    }
});

// Pàgina de benvinguda a l'arrel
app.get('/', (req, res) => {
    res.send('API de 73 Finestres - Sistema de Reserves funcionant correctament!');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor operatiu al port ${PORT}`));
