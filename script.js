let currentRoom = null;
let votingStarted = false;

// Get inputs
const ownerName = document.getElementById("ownerName");
const ownerProject = document.getElementById("ownerProject");
const joinCode = document.getElementById("joinCode");
const joinName = document.getElementById("joinName");
const joinProjectInput = document.getElementById("joinProjectInput");
const joinStatus = document.getElementById("joinStatus");

// Create Room
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

// Join Room
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
    await window.dbSet(newProjectRef, { name, project, votes: 0, owner:false });
    currentRoom = code;
    showLobby(code);
  }
});

// Show Lobby
function showLobby(code) {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("roomCodeDisplay").textContent = code;
  document.getElementById("createdCode").textContent = "";
}

// Listen for updates and update table
function listenRoom(code) {
  const roomRef = window.dbRef(window.db, "rooms/" + code);
  window.dbOnValue(roomRef, (snapshot) => {
    const list = snapshot.val();
    updateLobbyTable(list);
  });
}

// Update table in lobby
function updateLobbyTable(list) {
  const table = document.getElementById("projectTable");
  table.innerHTML = "";
  for (const key in list) {
    const p = list[key];
    table.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
  }
}

// Start Voting + show choices
document.getElementById("startBtn").addEventListener("click", async () => {
  if (!currentRoom) return alert("No room selected!");

  votingStarted = true;

  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("votePage").classList.remove("hidden");

  const roomRef = window.dbRef(window.db, "rooms/" + currentRoom);
  const snap = await window.dbGet(roomRef);

  if (snap.exists()) {
    const projects = snap.val();
    const voteList = document.getElementById("voteList");
    voteList.innerHTML = "";

    for (const key in projects) {
      const p = projects[key];
      voteList.innerHTML += `
        <li>${p.name} — ${p.project}
          <button class="voteBtn" onclick="vote('${key}')">Vote</button>
        </li>`;
    }
  }
});

// Voting function
window.vote = async function(key) {
  if (!currentRoom) return;
  const projRef = window.dbRef(window.db, "rooms/" + currentRoom + "/" + key);
  const snapshot = await window.dbGet(projRef);
  if (snapshot.exists()) {
    const currentVotes = snapshot.val().votes;
    await window.dbUpdateData(projRef, { votes: currentVotes + 1 });
  }
}

// Show Results + detect winner
window.showResults = function(list){
  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";
  let winnerName = "";
  let max = -1;

  for (const key in list) {
    const p = list[key];
    resultsTable.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
    if(p.votes > max){
       max = p.votes;
       winnerName = p.name + " (" + p.project + ")";
    }
  }

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("winner").textContent = winnerName;
};

// Listen results when voting started
window.dbOnValue(window.dbRef(window.db, "rooms/" + currentRoom), (snap)=>{
  if(votingStarted && snap.exists()){
    showResults(snap.val());
  }
});
