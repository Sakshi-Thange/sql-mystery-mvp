// ---------------- DATABASE SETUP ----------------

// Scenes
alasql('CREATE TABLE scenes (id INT, text STRING)');
alasql("INSERT INTO scenes VALUES (1, 'You arrive at the hotel. A storm rages outside.')");
alasql("INSERT INTO scenes VALUES (2, 'You enter the library. A body is lying on the floor.')");
alasql("INSERT INTO scenes VALUES (3, 'You find a torn glove near the fireplace.')");
alasql("INSERT INTO scenes VALUES (4, 'You discover a threatening letter hidden in a drawer.')");
alasql("INSERT INTO scenes VALUES (5, 'Final Accusation: Who is the killer?')");

// Choices
alasql('CREATE TABLE choices (id INT, scene_id INT, text STRING, next_scene_id INT, evidence_id INT)');
alasql("INSERT INTO choices VALUES (1, 1, 'Go to the library', 2, NULL)");
alasql("INSERT INTO choices VALUES (2, 1, 'Check fireplace', 3, 1)");
alasql("INSERT INTO choices VALUES (3, 2, 'Search the body', 4, 2)");
alasql("INSERT INTO choices VALUES (4, 2, 'Go upstairs', 5, NULL)");
alasql("INSERT INTO choices VALUES (5, 3, 'Return to lobby', 1, NULL)");

// Evidence
alasql('CREATE TABLE evidence (id INT, name STRING, description STRING)');
alasql("INSERT INTO evidence VALUES (1, 'Glove', 'A torn glove with initials M.K.')");
alasql("INSERT INTO evidence VALUES (2, 'Letter', 'A threatening letter addressed to the victim.')");

// Suspects (initially no guilty column!)
alasql('CREATE TABLE suspects (id INT, name STRING, alibi STRING)');
alasql("INSERT INTO suspects VALUES (1, 'Mr. King', 'Claims he was in the kitchen.')");
alasql("INSERT INTO suspects VALUES (2, 'Mrs. Rose', 'Was reading in her room.')");
alasql("INSERT INTO suspects VALUES (3, 'Detective Grey', 'Investigating another case.')");

// ---------------- GAME STATE ----------------
let currentScene = 1;
let inventory = [];
let evidenceCount = 0;

// ---------------- RENDER FUNCTIONS ----------------
function renderScene(sceneId) {
    let scene = alasql('SELECT * FROM scenes WHERE id = ?', [sceneId])[0];
    let choices = alasql('SELECT * FROM choices WHERE scene_id = ?', [sceneId]);

    document.getElementById('story').innerText = scene.text;

    let buttonsDiv = document.getElementById('choices');
    buttonsDiv.innerHTML = '';

    choices.forEach(choice => {
        let btn = document.createElement('button');
        btn.innerText = choice.text;
        btn.onclick = () => {
            if (choice.evidence_id) {
                let ev = alasql('SELECT * FROM evidence WHERE id = ?', [choice.evidence_id])[0];
                if (!inventory.find(item => item.id === ev.id)) {
                    inventory.push(ev);
                    evidenceCount++;

                    // Unlock suspect clues after each evidence
                    if (evidenceCount === 1) {
                        alasql('ALTER TABLE suspects ADD COLUMN clue1 STRING');
                        alasql("UPDATE suspects SET clue1='Glove found near fireplace' WHERE name='Mr. King'");
                    }
                    if (evidenceCount === 2) {
                        alasql('ALTER TABLE suspects ADD COLUMN clue2 STRING');
                        alasql("UPDATE suspects SET clue2='Letter links to Mr. King' WHERE name='Mr. King'");
                    }
                    if (evidenceCount === 2) {
                        // Finally reveal guilty column after 2 clues
                        alasql('ALTER TABLE suspects ADD COLUMN guilty BOOL');
                        alasql("UPDATE suspects SET guilty=TRUE WHERE name='Mr. King'");
                        alasql("UPDATE suspects SET guilty=FALSE WHERE name!='Mr. King'");
                    }
                }
                renderInventory();
            }
            if (choice.next_scene_id === 5) {
                renderSuspects();
            }
            renderScene(choice.next_scene_id);
        };
        buttonsDiv.appendChild(btn);
    });
}

function renderInventory() {
    let list = document.getElementById('inventory');
    list.innerHTML = '';
    inventory.forEach(item => {
        let li = document.createElement('li');
        li.innerText = `${item.name} - ${item.description}`;
        list.appendChild(li);
    });
}

function renderSuspects() {
    let suspects = alasql('SELECT * FROM suspects');
    let list = document.getElementById('suspects');
    list.innerHTML = '';

    suspects.forEach(sus => {
        let li = document.createElement('li');
        li.innerText = `${sus.name} - Alibi: ${sus.alibi}`;
        list.appendChild(li);
    });
}

// ---------------- USER SQL QUERY ----------------
function runUserQuery() {
    let query = document.getElementById('sqlInput').value;
    let resultDiv = document.getElementById('queryResult');
    resultDiv.innerHTML = '';

    try {
        let res = alasql(query);

        if (Array.isArray(res)) {
            let table = document.createElement('table');
            table.border = "1";

            if (res.length > 0) {
                let headerRow = document.createElement('tr');
                Object.keys(res[0]).forEach(col => {
                    let th = document.createElement('th');
                    th.innerText = col;
                    headerRow.appendChild(th);
                });
                table.appendChild(headerRow);
            }

            res.forEach(row => {
                let tr = document.createElement('tr');
                Object.values(row).forEach(val => {
                    let td = document.createElement('td');
                    td.innerText = val;
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });
if (query.includes("guilty") && evidenceCount < 2) {
    throw new Error("🚫 You cannot access 'guilty' until more evidence is found.");
}

            resultDiv.appendChild(table);
        } else {
            resultDiv.innerText = JSON.stringify(res);
        }
    } catch (err) {
        resultDiv.innerHTML = `<span style="color:red;">Error: ${err.message}</span>`;
    }
}

// ---------------- START GAME ----------------
renderScene(currentScene);
