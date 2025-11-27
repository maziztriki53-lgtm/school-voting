let rooms = {};

function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create Room
function createRoom() {
    const name = document.getElementById('ownerName').value;
    const project = document.getElementById('ownerProject').value;

    if(!name || !project) return alert("Enter name and project");

    const roomCode = generateRoomCode();
    rooms[roomCode] = {owner: name, participants: {}, projects: [{name, project, votes: 0}]};

    // owner is automatically participant
    rooms[roomCode].participants[name] = {voted: []};

    document.getElementById('roomCodeDisplay').innerText = "Room Code: " + roomCode;
    document.getElementById('startVotingBtn').style.display = "inline-block";
    alert("Share this code with your friends to join!");
}

// Join Room
function joinRoom() {
    const name = document.getElementById('joinName').value;
    const project = document.getElementById('joinProject').value;
    const code = document.getElementById('roomCodeInput').value;

    if(!name || !project || !code) return alert("Fill all fields");
    if(!rooms[code]) return alert("Invalid Room Code");
    if(rooms[code].participants[name]) return alert("This name is already taken in the room");

    rooms[code].projects.push({name, project, votes: 0});
    rooms[code].participants[name] = {voted: []};
    alert(name + " joined the room!");
}

// Start Voting
function startVoting() {
    const code = document.getElementById('roomCodeDisplay').innerText.split("Room Code: ")[1];
    if(!code || !rooms[code]) return alert("Room not found");

    document.getElementById('createRoomSection').style.display = 'none';
    document.getElementById('joinRoomSection').style.display = 'none';
    document.getElementById('votingSection').style.display = 'block';

    renderProjects(code);
}

// Render Projects for Voting
function renderProjects(roomCode) {
    const container = document.getElementById('projectsContainer');
    container.innerHTML = "";

    rooms[roomCode].projects.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = "projectCard";
        div.id = "project-" + index;
        div.innerHTML = `
            <h3>${p.name}'s Project</h3>
            <p>${p.project}</p>
            <p>Votes: <span id="votes-${index}">${p.votes}</span></p>
            <input type="text" placeholder="Your Name" id="voterName-${index}">
            <button onclick="vote('${roomCode}', ${index})">Vote</button>
        `;
        container.appendChild(div);
    });
}

// Vote Function with duplicate prevention
function vote(roomCode, projectIndex) {
    const voterInput = document.getElementById('voterName-' + projectIndex);
    const voterName = voterInput.value.trim();
    if(!voterName) return alert("Enter your name to vote");

    const room = rooms[roomCode];

    if(!room.participants[voterName]) return alert("Name not registered in this room");
    if(room.participants[voterName].voted.includes(projectIndex)) {
        return alert("You already voted for this project!");
    }

    // Add vote
    room.projects[projectIndex].votes++;
    document.getElementById('votes-' + projectIndex).innerText = room.projects[projectIndex].votes;
    room.participants[voterName].voted.push(projectIndex);

    highlightWinner(roomCode);
}

// Highlight current winner
function highlightWinner(roomCode) {
    const projects = rooms[roomCode].projects;
    let maxVotes = Math.max(...projects.map(p => p.votes));
    let winnerIndex = projects.findIndex(p => p.votes === maxVotes);

    const container = document.getElementById('projectsContainer');
    container.childNodes.forEach((card, i) => {
        if(i === winnerIndex && maxVotes > 0) {
            card.style.border = "3px solid green";
        } else if(card.className === "projectCard") {
            card.style.border = "1px solid gray";
        }
    });

    // Display 🏆 Winner at top
    let winnerName = projects[winnerIndex].name;
    let winnerText = document.getElementById('winnerDisplay');
    if(!winnerText) {
        winnerText = document.createElement('h2');
        winnerText.id = 'winnerDisplay';
        container.parentNode.insertBefore(winnerText, container);
    }
    winnerText.innerHTML = `🏆 Current Winner: ${winnerName}`;
}
