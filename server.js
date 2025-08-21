const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));

// ensure db file
const DB_FILE = path.join(__dirname, 'data.sqlite');
const dbExists = fs.existsSync(DB_FILE);
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  if(!dbExists){
    db.run(`CREATE TABLE forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      questions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER,
      answers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('Database created with tables.');
  }
});

// API: create form
app.post('/api/forms', (req, res) => {
  const {title, description, questions} = req.body;
  if(!title || !questions) return res.status(400).json({error:'title and questions required'});
  const qstr = JSON.stringify(questions);
  db.run('INSERT INTO forms (title, description, questions) VALUES (?,?,?)', [title, description||'', qstr], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id: this.lastID});
  });
});

// list forms
app.get('/api/forms', (req, res) => {
  db.all('SELECT id, title, description, created_at FROM forms ORDER BY created_at DESC', [], (err, rows) => {
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// get single form (with questions)
app.get('/api/forms/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT id, title, description, questions FROM forms WHERE id = ?', [id], (err, row) => {
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'form not found'});
    row.questions = JSON.parse(row.questions);
    res.json(row);
  });
});

// submit response
app.post('/api/forms/:id/responses', (req, res) => {
  const id = req.params.id;
  const {answers} = req.body;
  db.get('SELECT id FROM forms WHERE id = ?', [id], (err, row) => {
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'form not found'});
    db.run('INSERT INTO responses (form_id, answers) VALUES (?,?)', [id, JSON.stringify(answers||{})], function(err){
      if(err) return res.status(500).json({error:err.message});
      res.json({response_id: this.lastID});
    });
  });
});

// list responses for form (raw)
app.get('/api/forms/:id/responses', (req, res) => {
  const id = req.params.id;
  db.all('SELECT id, answers, created_at FROM responses WHERE form_id = ? ORDER BY created_at DESC', [id], (err, rows) => {
    if(err) return res.status(500).json({error:err.message});
    rows = rows.map(r => ({id:r.id, answers: JSON.parse(r.answers), created_at: r.created_at}));
    res.json(rows);
  });
});

// analytics - basic aggregation
app.get('/api/forms/:id/analytics', (req, res) => {
  const id = req.params.id;
  db.get('SELECT questions from forms WHERE id = ?', [id], (err, row) => {
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'form not found'});
    const questions = JSON.parse(row.questions);
    db.all('SELECT answers FROM responses WHERE form_id = ?', [id], (err2, rows) => {
      if(err2) return res.status(500).json({error:err2.message});
      const agg = {};
      questions.forEach((q, idx) => {
        if(q.type === 'mcq'){
          agg[idx] = {};
          (q.options || []).forEach(opt => agg[idx][opt]=0);
        } else {
          agg[idx] = [];
        }
      });
      rows.forEach(r => {
        const ans = JSON.parse(r.answers);
        questions.forEach((q, idx) => {
          const a = ans[idx];
          if(q.type === 'mcq'){
            if(Array.isArray(a)){
              a.forEach(val => { if(agg[idx][val] !== undefined) agg[idx][val]++; });
            } else {
              if(agg[idx][a] !== undefined) agg[idx][a]++;
            }
          } else {
            if(a) agg[idx].push(a);
          }
        });
      });
      res.json({questions, aggregate: agg, total_responses: rows.length});
    });
  });
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log('Server running on port', PORT));
