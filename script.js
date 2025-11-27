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

// Start voting + Build options + Reset old vote
document.getElementById("startBtn").addEventListener("click", async () => {
  if (!currentRoom) return alert("No room selected!");

  // reset old voting session
  localStorage.removeItem("alreadyVoted");

  const voterName = document.getElementById("joinName")?.value.trim() ||
                    document.getElementById("ownerName")?.value.trim();

  if (!voterName) return alert("No voter name найден!");

  localStorage.setItem("voterName", voterName);

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

    // disable self vote in UI
    const disabled = p.name === voterName ? "disabled" : "";

    voteList.innerHTML += `
      <li>${p.name} — ${p.project}
      <button class="voteBtn" ${disabled} data-key="${key}">Vote</button>
      </li>
    `;
  }

  document.querySelectorAll(".voteBtn").forEach(btn => {
    btn.addEventListener("click", () => vote(btn.getAttribute("data-key")));
  });
});

// Vote function: block self + block multiple votes
async function vote(key) {
  const voter = localStorage.getItem("voterName");

  if (localStorage.getItem("alreadyVoted")) {
    return alert("❌ You already voted! Only 1 vote allowed.");
  }

  const projRef = window.dbRef(window.db, "rooms/" + currentRoom + "/" + key);
  const snapshot = await window.dbGet(projRef);
  const data = snapshot.val();

  if (data.name === voter) {
    return alert("❌ You cannot vote for your own project!");
  }

  await window.dbUpdateData(projRef, { votes: data.votes + 1 });

  // save vote status
  localStorage.setItem("alreadyVoted", "true");
  alert("✅ Vote submitted!");
}

// Show results and detect winner
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
