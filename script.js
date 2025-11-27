let currentRoom = null;
let votingStarted = false;

// Create Room
document.getElementById("createBtn").addEventListener("click", async () => {
  const name = document.getElementById("ownerName").value.trim();
  const project = document.getElementById("ownerProject").value.trim();
  if (!name || !project) return alert("Fill all fields!");

  const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

  const roomRef = window.dbRef(window.db, "rooms/" + roomCode);
  const newProjectRef = window.dbPush(roomRef);

  await window.dbSet(newProjectRef, { name, project, votes: 0, owner: true });

  currentRoom = roomCode;
  showLobby(roomCode);
  listenRoom(roomCode);
});

// Join Room
document.getElementById("joinBtn").addEventListener("click", async () => {
  const code = document.getElementById("joinCode").value.trim();
  const name = document.getElementById("joinName").value.trim();
  const project = document.getElementById("joinProjectInput").value.trim();
  if (!code || !name || !project) return alert("Fill all fields!");

  const roomRef = window.dbRef(window.db, "rooms/" + code);
  const snapshot = await window.dbGet(roomRef);

  if (!snapshot.exists()) {
    document.getElementById("joinStatus").textContent = "Room not found!";
  } else {
    const newProjectRef = window.dbPush(roomRef);
    await window.dbSet(newProjectRef, { name, project, votes: 0, owner:false });
    currentRoom = code;
    showLobby(code);
    listenRoom(code);
  }
});

// Show Lobby Page
function showLobby(code) {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("roomCodeDisplay").textContent = code;
}

// Listen Firebase Room Updates
function listenRoom(code) {
  const roomRef = window.dbRef(window.db, "rooms/" + code);
  window.dbOnValue(roomRef, (snapshot) => {
    updateLobbyTable(snapshot.val());
    if (votingStarted) showResults(snapshot.val());
  });
}

// Update Table in Lobby
function updateLobbyTable(list) {
  const table = document.getElementById("projectTable");
  table.innerHTML = "";
  for (const key in list) {
    const p = list[key];
    table.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
  }
}

// Show Voting Choices
document.getElementById("startBtn").addEventListener("click", async () => {
  if (!currentRoom) return alert("No room selected!");

  votingStarted = true;
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("votePage").classList.remove("hidden");

  const roomRef = window.dbRef(window.db, "rooms/" + currentRoom);
  const snap = await window.dbGet(roomRef);
  const projects = snap.val();

  const voteList = document.getElementById("voteList");
  voteList.innerHTML = "";
  for (const key in projects) {
    const p = projects[key];
    voteList.innerHTML += `
      <li>${p.name} — ${p.project}
      <button class="voteBtn" data-key="${key}">Vote</button>
      </li>
    `;
  }

  // Add click listeners to all Vote buttons
  document.querySelectorAll(".voteBtn").forEach(btn => {
    btn.addEventListener("click", () => vote(btn.getAttribute("data-key")));
  });
});

// Voting Function
async function vote(key) {
  const projRef = window.dbRef(window.db, "rooms/" + currentRoom + "/" + key);
  const snapshot = await window.dbGet(projRef);
  const currentVotes = snapshot.val().votes;
  await window.dbUpdateData(projRef, { votes: currentVotes + 1 });
}

// Show Results + Winner
function showResults(list) {
  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";
  let max = -1;
  let winner = "";

  for (const key in list) {
    const p = list[key];
    resultsTable.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
    if (p.votes > max) {
      max = p.votes;
      winner = `${p.name} (${p.project})`;
    }
  }

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("winner").textContent = winner;
}
