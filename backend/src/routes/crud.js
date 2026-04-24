const express = require('express');
const pool = require('../db/connection');

function createCrudRouter(tableName, { orderBy = 'id DESC', searchFields = [] } = {}) {
  const router = express.Router();

  // GET all
  router.get('/', async (req, res) => {
    try {
      const { search } = req.query;
      let query = `SELECT * FROM ${tableName}`;
      let params = [];
      if (search && searchFields.length > 0) {
        const conditions = searchFields.map((f, i) => `${f} ILIKE $${i + 1}`);
        query += ` WHERE ${conditions.join(' OR ')}`;
        params = searchFields.map(() => `%${search}%`);
      }
      query += ` ORDER BY ${orderBy}`;
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = values.map((_, i) => `$${i + 1}`);
      const result = await pool.query(
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
