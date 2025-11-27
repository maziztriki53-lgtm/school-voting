let currentRoom = null;
let votingStarted = false;

// Get input elements
const ownerName = document.getElementById("ownerName");
const ownerProject = document.getElementById("ownerProject");
const joinCode = document.getElementById("joinCode");
const joinName = document.getElementById("joinName");
const joinProjectInput = document.getElementById("joinProjectInput");

// Create room
document.getElementById("createBtn").addEventListener("click", async () => {
  const name = ownerName.value.trim();
  const project = ownerProject.value.trim();
  if (!name || !project) return alert("Fill all fields!");

  const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

  const roomRef = window.dbRef(window.db, "rooms/" + roomCode);
  const newProjectRef = window.dbPush(roomRef);

  await window.dbSet(newProjectRef, { name, project, votes: 0, owner: true });

  currentRoom = roomCode;
  showLobby(roomCode);
});

// Join room
document.getElementById("joinBtn").addEventListener("click", async () => {
  const code = joinCode.value.trim();
  const name = joinName.value.trim();
  const project = joinProjectInput.value.trim();
  if (!code || !name || !project) return alert("Fill all fields!");

  const roomRef = window.dbRef(window.db, "rooms/" + code);
  const snapshot = await window.dbGet(roomRef);

  if (!snapshot.exists()) {
    joinStatus.textContent = "Room not found!";
  } else {
    const newProjectRef = window.dbPush(roomRef);
    await window.dbSet(newProjectRef, { name, project, votes: 0, owner: false });
    currentRoom = code;
    showLobby(code);
  }
});

// Show Lobby
function showLobby(code) {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("roomCodeDisplay").textContent = code;
  listenRoom(code);
}

// Listen for realtime updates
function listenRoom(code) {
  const roomRef = window.dbRef(window.db, "rooms/" + code);
  window.dbOnValue(roomRef, (snapshot) => {
    const list = snapshot.val();
    updateLobbyTable(list);

    if (votingStarted) {
      showVotePage(list);
      updateResults(list);
    }
  });
}

// Update Lobby Table
function updateLobbyTable(list) {
  const table = document.getElementById("projectTable");
  table.innerHTML = "";
  for (const key in list) {
    const p = list[key];
    table.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
  }
}

// Start voting
document.getElementById("startBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("votePage").classList.remove("hidden");
  votingStarted = true;
});

// Show Vote UI
function showVotePage(list) {
  const voteList = document.getElementById("voteList");
  voteList.innerHTML = "";
  for (const key in list) {
    const p = list[key];
    voteList.innerHTML += `<li>${p.name} — ${p.project} 
      <button class="voteBtn" onclick="vote('${key}')">Vote</button>
    </li>`;
  }
}

// Voting logic (1 vote per click for now)
window.vote = async function (key) {
  if (!currentRoom) return;
  const projRef = window.dbRef(window.db, "rooms/" + currentRoom + "/" + key);
  const snapshot = await window.dbGet(projRef);
  if (snapshot.exists()) {
    const currentVotes = snapshot.val().votes;
    await window.dbUpdateData(projRef, { votes: currentVotes + 1 });
  }
};

// Results + Winner
function updateResults(list) {
  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";
  let winnerName = "";
  let maxVotes = -1;

  for (const key in list) {
    const p = list[key];
    resultsTable.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
    if (p.votes > maxVotes) {
      maxVotes = p.votes;
      winnerName = p.name + " (" + p.project + ")";
    }
  }

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("winner").textContent = winnerName;
}

// Back home (reload)
document.getElementById("backHomeBtn").addEventListener("click", () => {
  location.reload();
});
