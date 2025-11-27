// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuaIPuFIwg2y97ClvtXZ6RaohErEWYwww",
    authDomain: "school-voting-online.firebaseapp.com",
    databaseURL: "https://school-voting-online-default-rtdb.firebaseio.com",
    projectId: "school-voting-online",
    storageBucket: "school-voting-online.appspot.com",
    messagingSenderId: "1723386840",
    appId: "1:1723386840:web:a3f6381018268c443ac0ad",
    measurementId: "G-JTP0YZCJ5Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
firebase.analytics();

// Generate 6-digit room code
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create Room
function createRoom() {
    const name = document.getElementById('ownerName').value.trim();
    const project = document.getElementById('ownerProject').value.trim();
    if (!name || !project) return alert("Enter name and project");

    const roomCode = generateRoomCode();
    const roomData = {
        owner: name,
        participants: { [name]: { voted: [] } },
        projects: [{ name, project, votes: 0 }]
    };

    db.ref('rooms/' + roomCode).set(roomData, (error) => {
        if (error) {
            alert("Error creating room: " + error);
        } else {
            document.getElementById('roomCodeDisplay').innerText = "Room Code: " + roomCode;
            document.getElementById('startVotingBtn').style.display = "inline-block";
            alert("Room created! Share this code: " + roomCode);
        }
    });
}

// Join Room
function joinRoom() {
    const name = document.getElementById('joinName').value.trim();
    const project = document.getElementById('joinProject').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim();

    if (!name || !project || !code) return alert("Fill all fields");

    const roomRef = db.ref('rooms/' + code);
    roomRef.get().then(snapshot => {
        if (!snapshot.exists()) return alert("Invalid Room Code");

        const room = snapshot.val();
        if (room.participants[name]) return alert("This name is already taken in the room");

        room.projects.push({ name, project, votes: 0 });
        room.participants[name] = { voted: [] };

        roomRef.set(room, (error) => {
            if (error) return alert("Error joining room: " + error);

            alert(name + " joined the room!");
            document.getElementById('createRoomSection').style.display = 'none';
            document.getElementById('joinRoomSection').style.display = 'none';
            document.getElementById('votingSection').style.display = 'block';
            renderProjectsFirebase(code);
        });
    });
}

// Start Voting
function startVoting() {
    const code = document.getElementById('roomCodeDisplay').innerText.split("Room Code: ")[1];
    if (!code) return alert("Room not found");

    document.getElementById('createRoomSection').style.display = 'none';
    document.getElementById('joinRoomSection').style.display = 'none';
    document.getElementById('votingSection').style.display = 'block';
    renderProjectsFirebase(code);
}

// Render Projects
function renderProjectsFirebase(roomCode) {
    const roomRef = db.ref('rooms/' + roomCode);
    roomRef.on('value', snapshot => {
        if (!snapshot.exists()) return;
        const room = snapshot.val();
        const container = document.getElementById('projectsContainer');
        container.innerHTML = "";

        room.projects.forEach((p, index) => {
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

        highlightWinner(room);
    });
}

// Vote
function vote(roomCode, projectIndex) {
    const voterName = document.getElementById('voterName-' + projectIndex).value.trim();
    if (!voterName) return alert("Enter your name to vote");

    const roomRef = db.ref('rooms/' + roomCode);
    roomRef.get().then(snapshot => {
        if (!snapshot.exists()) return alert("Room not found");

        const room = snapshot.val();
        if (!room.participants[voterName]) return alert("Name not registered");
        if (room.participants[voterName].voted.includes(projectIndex)) return alert("Already voted");

        room.projects[projectIndex].votes++;
        room.participants[voterName].voted.push(projectIndex);

        roomRef.set(room);
    });
}

// Highlight Winner
function highlightWinner(room) {
    const projects = room.projects;
    const maxVotes = Math.max(...projects.map(p => p.votes));
    const winnerIndex = projects.findIndex(p => p.votes === maxVotes);

    const container = document.getElementById('projectsContainer');
    container.childNodes.forEach((card, i) => {
        if (i === winnerIndex && maxVotes > 0) card.style.border = "3px solid green";
        else if (card.className === "projectCard") card.style.border = "1px solid gray";
    });

    let winnerName = projects[winnerIndex].name;
    let winnerText = document.getElementById('winnerDisplay');
    if (!winnerText) {
        winnerText = document.createElement('h2');
        winnerText.id = 'winnerDisplay';
        container.parentNode.insertBefore(winnerText, container);
    }
    winnerText.innerHTML = `🏆 Current Winner: ${winnerName}`;
}
