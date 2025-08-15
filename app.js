/** SQL Chronicles — Mission 1 (AlaSQL in-browser) **/

// Schema + seed
const schemaSQL = `
CREATE TABLE Employees (
  id INT PRIMARY KEY,
  name STRING,
  role STRING,
  hoodie_color STRING
);

CREATE TABLE LoginLogs (
  id INT PRIMARY KEY,
  employee_id INT,
  login_time STRING,
  logout_time STRING
);
`;

const seedSQL = `
INSERT INTO Employees VALUES
  (1,'Aryan Singh','Barista','red'),
  (2,'Sneha Patil','Manager','black'),
  (3,'Rahul Mehta','Chef','blue'),
  (4,'Tanya Desai','Cleaner','red'),
  (5,'Omkar Joshi','Cashier','green');

INSERT INTO LoginLogs VALUES
  (1,1,'2025-06-11 17:00','2025-06-11 20:30'),
  (2,2,'2025-06-11 15:00','2025-06-11 21:00'),
  (3,3,'2025-06-11 18:00','2025-06-11 22:00'),
  (4,4,'2025-06-11 20:00','2025-06-11 21:30'),
  (5,5,'2025-06-11 19:30','2025-06-11 20:00');
`;

// Mission copy
const missionPrompt = `🕵️‍♀️ Mission 1: The Late Shift

The manager was attacked around 9:30 PM at Café Noir. A witness saw someone in a red hoodie.

Goal: Find employees who were actively logged in at 9:30 PM and wore a red hoodie.

Tables:
- Employees(id, name, role, hoodie_color)
- LoginLogs(id, employee_id, login_time, logout_time)

Tip: JOIN the tables. Time filter: '2025-06-11 21:30' should be between login_time and logout_time.
`;

const starterQuery = `-- Write your SQL below
-- Example to get you started:
-- SELECT e.name, e.role
-- FROM Employees e
-- JOIN LoginLogs l ON e.id = l.employee_id
-- WHERE '2025-06-11 21:30' BETWEEN l.login_time AND l.logout_time
--   AND e.hoodie_color = 'red';
`;

// Init UI text
document.getElementById('missionPrompt').textContent = missionPrompt;
document.getElementById('sqlInput').value = starterQuery;
document.getElementById('hints').innerHTML = `
  <div class="bold">Hints</div>
  <ul>
    <li>Use <code>JOIN</code> to combine <code>Employees</code> and <code>LoginLogs</code>.</li>
    <li>Check if a specific time falls <em>between</em> login and logout.</li>
    <li>Filter by <code>hoodie_color = 'red'</code>.</li>
    <li>Return <code>name</code> and <code>role</code> of suspects.</li>
  </ul>
  <details style="margin-top:6px;">
    <summary>Still stuck? Reveal a solution</summary>
    <pre style="margin-top:6px;white-space:pre-wrap;background:#fff;border:1px solid #e5e7eb;padding:8px;border-radius:10px;font-size:12px;">SELECT e.name, e.role
FROM Employees e
JOIN LoginLogs l ON e.id = l.employee_id
WHERE '2025-06-11 21:30' BETWEEN l.login_time AND l.logout_time
  AND e.hoodie_color = 'red';</pre>
  </details>
`;
document.getElementById('schema').textContent = schemaSQL;

// DB bootstrap
function initDB() {
  
  alasql('CREATE DATABASE sqlsleuth');
alasql('USE sqlsleuth');

  alasql(schemaSQL);
  alasql(seedSQL);
}
initDB();

// Helpers
function renderTable(rows){
  const wrap = document.getElementById('results');
  wrap.innerHTML = '';
  if(!rows || rows.length === 0){
    wrap.innerHTML = '<div class="muted">No rows returned.</div>';
    return;
  }
  const cols = Object.keys(rows[0]);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  cols.forEach(c=>{
    const th = document.createElement('th'); th.textContent = c; trh.appendChild(th);
  });
  thead.appendChild(trh);
  const tbody = document.createElement('tbody');
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    cols.forEach(c=>{
      const td = document.createElement('td'); td.textContent = String(r[c]); tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(thead); table.appendChild(tbody);
  wrap.appendChild(table);
}

function show(id, on){ document.getElementById(id).classList.toggle('hidden', !on); }

// Buttons
document.getElementById('toggleHints').addEventListener('click', ()=>{
  const el = document.getElementById('hints');
  const btn = document.getElementById('toggleHints');
  const isHidden = el.classList.contains('hidden');
  show('hints', isHidden);
  btn.textContent = isHidden ? 'Hide Hints' : 'Show Hints';
});

document.getElementById('toggleSchema').addEventListener('click', ()=>{
  const el = document.getElementById('schema');
  const btn = document.getElementById('toggleSchema');
  const isHidden = el.classList.contains('hidden');
  show('schema', isHidden);
  btn.textContent = isHidden ? 'Hide Schema' : 'Show Schema';
});

document.getElementById('resetBtn').addEventListener('click', ()=>{
  initDB();
  document.getElementById('sqlInput').value = starterQuery;
  document.getElementById('error').textContent = '';
  show('error', false);
  show('success', false);
  show('status', false);
  document.getElementById('results').innerHTML = '';
});

document.getElementById('runBtn').addEventListener('click', ()=>{
  const errorBox = document.getElementById('error');
  errorBox.textContent = '';
  show('error', false);

  try{
    const sql = document.getElementById('sqlInput').value;
    const res = alasql(sql);
    const rows = Array.isArray(res) ? res : [];
    renderTable(rows);

    // Validate: compare to expected (order-insensitive)
    const expected = alasql(`
      SELECT e.name AS name, e.role AS role
      FROM Employees e
      JOIN LoginLogs l ON e.id = l.employee_id
      WHERE '2025-06-11 21:30' BETWEEN l.login_time AND l.logout_time
        AND e.hoodie_color = 'red'
      ORDER BY name, role
    `);

    const normUser = rows
      .map(r => ({ name: String(r.name ?? r.NAME ?? r['e.name'] ?? ''), role: String(r.role ?? r.ROLE ?? r['e.role'] ?? '') }))
      .filter(r => r.name && r.role)
      .sort((a,b)=> (a.name+a.role).localeCompare(b.name+b.role));

    const ok = normUser.length === expected.length &&
               normUser.every((r,i)=> r.name===expected[i].name && r.role===expected[i].role);

    if(ok && normUser.length>0){
      show('status', true);
      show('success', true);
    }
  }catch(err){
    errorBox.textContent = String(err.message || err);
    show('error', true);
  }
});
