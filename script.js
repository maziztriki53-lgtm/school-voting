let currentRoom = null;
let votingStarted = false;

// Create Room
ownerName && document.getElementById("createBtn").addEventListener("click", async () => {
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

// Display Lobby
function showLobby(code){
  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  roomCodeDisplay.textContent = code;
  createdCode.textContent = isOwner ? "Your room code: "+code : "";
  listenRoom(code);
}

// Listen for updates
function listenRoom(code){
  const roomRef = window.dbRef(window.db, "rooms/" + code);
  window.dbOnValue(roomRef, (snapshot)=>{
    const list = snapshot.val();
    updateLobbyTable(list);

    if(votingStarted){
      showVotePage(list);
      updateResults(list);
    }
  });
}

// Update lobby table
function updateLobbyTable(list){
  const table = document.getElementById("projectTable");
  table.innerHTML = "";
  for(const key in list){
    const p = list[key];
    table.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
  }
}

// Start voting
document.getElementById("startBtn").addEventListener("click", ()=>{
  if(!currentRoom) return;
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("votePage").classList.remove("hidden");
  votingStarted = true;
});

// Show voting UI
function showVotePage(list){
  if(!votingStarted) return;
  const voteList = document.getElementById("voteList");
  voteList.innerHTML = "";
  for(const key in list){
    const p = list[key];
    voteList.innerHTML += `<li>${p.name} — ${p.project} <button class="voteBtn" onclick="vote('${key}')">Vote</button></li>`;
  }
}

// Vote for project
window.vote = async function(key){
  if(!currentRoom) return;
  const projRef = window.dbRef(window.db, "rooms/" + currentRoom + "/" + key);
  const snapshot = await window.dbGet(projRef);
  if(snapshot.exists()){
    const currentVotes = snapshot.val().votes;
    await window.dbUpdateData(projRef, { votes: currentVotes + 1 });
  }
};

// Show results and determine winner
function updateResults(list){
  document.getElementById("votePage").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");

  const resultsTable = document.getElementById("resultsTable");
  resultsTable.innerHTML = "";

  let winnerName = "";
  let maxVotes = -1;

  for(const key in list){
    const p = list[key];
    resultsTable.innerHTML += `<tr><td>${p.name}</td><td>${p.project}</td><td>${p.votes}</td></tr>`;
    if(p.votes > maxVotes){
      maxVotes = p.votes;
      winnerName = p.name + " ("+p.project+")";
    }
  }

  document.getElementById("winner").textContent = winnerName;
}

// back to home
document.getElementById("backHomeBtn").addEventListener("click", ()=>{
  location.reload();
});
