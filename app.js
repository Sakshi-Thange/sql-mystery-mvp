// ---------------- DATABASE SETUP ----------------

// Scenes (id, text)
alasql('CREATE TABLE scenes (id INT, text STRING)');
alasql("INSERT INTO scenes VALUES (1, 'You arrive at the hotel. A storm rages outside.')");
alasql("INSERT INTO scenes VALUES (2, 'You enter the library. A body is lying on the floor.')");
alasql("INSERT INTO scenes VALUES (3, 'You find a torn glove near the fireplace.')");
alasql("INSERT INTO scenes VALUES (4, 'You hear a scream from upstairs.')");
alasql("INSERT INTO scenes VALUES (5, 'Final Accusation: Who is the killer?')");

// Choices (id, scene_id, text, next_scene_id, evidence_id)
alasql('CREATE TABLE choices (id INT, scene_id INT, text STRING, next_scene_id INT, evidence_id INT)');
alasql("INSERT INTO choices VALUES (1, 1, 'Go to the library', 2, NULL)");
alasql("INSERT INTO choices VALUES (2, 1, 'Check fireplace', 3, 1)");
alasql("INSERT INTO choices VALUES (3, 2, 'Search the body', 3, 2)");
alasql("INSERT INTO choices VALUES (4, 2, 'Go upstairs', 4, NULL)");
alasql("INSERT INTO choices VALUES (5, 4, 'Confront suspects', 5, NULL)");

// Evidence (id, name, description)
alasql('CREATE TABLE evidence (id INT, name STRING, description STRING)');
alasql("INSERT INTO evidence VALUES (1, 'Glove', 'A torn glove with initials M.K.')");
alasql("INSERT INTO evidence VALUES (2, 'Letter', 'A threatening letter addressed to the victim.')");

// Suspects (id, name, alibi, guilty)
alasql('CREATE TABLE suspects (id INT, name STRING, alibi STRING, guilty BOOL)');
alasql("INSERT INTO suspects VALUES (1, 'Mr. King', 'Claims he was in the kitchen.', TRUE)");
alasql("INSERT INTO suspects VALUES (2, 'Mrs. Rose', 'Was reading in her room.', FALSE)");
alasql("INSERT INTO suspects VALUES (3, 'Detective Grey', 'Investigating another case.', FALSE)");

// ---------------- GAME STATE ----------------
let currentScene = 1;
let inventory = [];

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
            // Collect evidence if available
            if (choice.evidence_id) {
                let ev = alasql('SELECT * FROM evidence WHERE id = ?', [choice.evidence_id])[0];
                if (!inventory.find(item => item.id === ev.id)) {
                    inventory.push(ev);
                }
                renderInventory();
            }

            // If final scene (accusation), show suspects
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
        let btn = document.createElement('button');
        btn.innerText = `Accuse ${sus.name}`;
        btn.onclick = () => {
            if (sus.guilty) {
                alert(`✅ You solved it! ${sus.name} is the killer.`);
            } else {
                alert(`❌ Wrong! ${sus.name} is innocent. The real killer escaped.`);
            }
        };
        li.innerText = `${sus.name} - Alibi: ${sus.alibi} `;
        li.appendChild(btn);
        list.appendChild(li);
    });
}

// ---------------- START GAME ----------------
renderScene(currentScene);


function runUserQuery() {
    let query = document.getElementById('sqlInput').value;
    let resultDiv = document.getElementById('queryResult');
    resultDiv.innerHTML = '';

    try {
        let res = alasql(query);

        if (Array.isArray(res)) {
            // Render table
            let table = document.createElement('table');
            table.border = "1";

            // headers
            if (res.length > 0) {
                let headerRow = document.createElement('tr');
                Object.keys(res[0]).forEach(col => {
                    let th = document.createElement('th');
                    th.innerText = col;
                    headerRow.appendChild(th);
                });
                table.appendChild(headerRow);
            }

            // rows
            res.forEach(row => {
                let tr = document.createElement('tr');
                Object.values(row).forEach(val => {
                    let td = document.createElement('td');
                    td.innerText = val;
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });

            resultDiv.appendChild(table);
        } else {
            resultDiv.innerText = JSON.stringify(res);
        }
    } catch (err) {
        resultDiv.innerHTML = `<span style="color:red;">Error: ${err.message}</span>`;
    }
}
