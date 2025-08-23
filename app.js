// =======================
// FitUp Tracker - App.js
// =======================

let currentMuscle = "";
let currentDetailId = null;
let allExercises = [];

const EX_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// ────────────────────────────────
// Bootstrap: nome utente, grafico, listener logo/menu
// ────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  let username = localStorage.getItem("username");
  if (!username) {
    username = prompt("Inserisci il tuo nome:") || "Atleta";
    localStorage.setItem("username", username);
  }
  const welcomeEl = document.getElementById("welcome-text");
  if (welcomeEl) welcomeEl.textContent = "Benvenuto " + username + "!";

  updateWeekGraph();

  const logo = document.querySelector(".logo");
  if (logo) logo.addEventListener("click", () => document.getElementById("user-menu").classList.add("open"));

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchExercise();
  });

  await loadAllExercises();
  loadSavedExercises();
});

// ────────────────────────────────
// Load JSON esercizi
// ────────────────────────────────
async function loadAllExercises() {
  try {
    const res = await fetch(EX_DB_URL);
    allExercises = await res.json();
    console.log("✅ Esercizi caricati:", allExercises.length);
  } catch (err) {
    console.error("Errore caricamento ExerciseDB:", err);
  }
}

// ────────────────────────────────
// Navigazione schermate
// ────────────────────────────────
function openWorkout(muscle) {
  currentMuscle = muscle;
  document.getElementById("home").style.display = "none";
  document.getElementById("workout-screen").style.display = "block";
  document.getElementById("workout-title").textContent = "Allenamento " + muscle.toUpperCase();
  document.getElementById("searchResults").innerHTML = "";
  loadSavedExercises();
}

function goHome() {
  document.getElementById("workout-screen").style.display = "none";
  document.getElementById("exercise-detail").style.display = "none";
  document.getElementById("home").style.display = "grid";
  updateWeekGraph();
  loadSavedExercises();
}

// ────────────────────────────────
// Ricerca esercizi
// ────────────────────────────────
function searchExercise() {
  const input = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("searchResults");
  if (!input || !resultsDiv) return;

  const query = input.value.trim().toLowerCase();
  if (!query) {
    resultsDiv.innerHTML = "<p>Inserisci un nome esercizio.</p>";
    return;
  }

  const filtered = allExercises.filter(ex => 
    (ex.name && ex.name.toLowerCase().includes(query)) || 
    (ex.target && ex.target.toLowerCase().includes(query)) ||
    (ex.bodyPart && ex.bodyPart.toLowerCase().includes(query)) ||
    (ex.equipment && ex.equipment.toLowerCase().includes(query))
  );

  resultsDiv.innerHTML = "";
  if (!filtered.length) {
    resultsDiv.innerHTML = "<p>Nessun esercizio trovato.</p>";
    return;
  }

  filtered.forEach(ex => {
    let imgSrc = "";
    if (ex.images && ex.images.length > 0) {
      const fileName = ex.images[0].split("/").pop();
      imgSrc = IMG_BASE_URL + encodeURIComponent(ex.id) + "/" + fileName;
    }

    const row = document.createElement("div");
    row.className = "exercise-result";
    row.innerHTML = `
      <img src="${imgSrc}" alt="${ex.name}" width="120">
      <div>
        <p><strong>${ex.name}</strong></p>
        <small>${(ex.primaryMuscles || []).join(", ")}</small>
        <button class="add-btn">+ Aggiungi</button>
      </div>
    `;

    row.querySelector(".add-btn").addEventListener("click", () => {
      addExerciseToMuscle(ex.id, ex.name, ex.images);
    });

    resultsDiv.appendChild(row);
  });
}

// ────────────────────────────────
// Aggiungi esercizio al muscolo
// ────────────────────────────────
function addExerciseToMuscle(exId, name, images) {
  if (!currentMuscle) { 
    alert("Apri prima una categoria!"); 
    return; 
  }

  let exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
  if (exercises.some(e => e.exId === exId && e.muscle === currentMuscle)) {
    alert("Esercizio già presente in questa categoria.");
    return;
  }

  let imgSrc = '';
  if (images && images.length > 0) {
    const fileName = images[0].split("/").pop();
    imgSrc = IMG_BASE_URL + encodeURIComponent(exId) + "/" + fileName;
  }

  exercises.push({ 
    id: Date.now(), 
    exId, 
    muscle: currentMuscle, 
    name, 
    image: imgSrc, 
    logs: [] 
  });

  localStorage.setItem("myExercises", JSON.stringify(exercises));
  loadSavedExercises();
}

// ────────────────────────────────
// Lista esercizi salvati
// ────────────────────────────────
function loadSavedExercises() {
  const container = document.getElementById("savedExercises");
  if (!container) return;

  container.innerHTML = "";
  const exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
  if (!exercises.length) { container.innerHTML = "<p>Nessun esercizio salvato.</p>"; return; }

  exercises.forEach(ex => {
    const lastLog = ex.logs.length ? ex.logs[ex.logs.length - 1] : null;
    const lastText = lastLog ? `Ultimo: ${lastLog.sets}x${lastLog.reps} ${lastLog.weight}kg • ${new Date(lastLog.dateIso).toLocaleDateString()}` : "Nessun record";

    const row = document.createElement("div");
    row.className = "saved-exercise-row";
    row.dataset.id = ex.id;
    row.onclick = () => openExerciseDetail(ex.id);
    row.innerHTML = `
      <img class="saved-ex-gif" src="${ex.image || ''}" alt="${ex.name}">
      <div class="saved-ex-info">
        <div class="saved-ex-name">${ex.name}</div>
        <div class="saved-ex-last">${lastText}</div>
      </div>
      <span class="saved-ex-chevron">›</span>
    `;
    container.appendChild(row);
  });
}

// ────────────────────────────────
// Dettaglio esercizio
// ────────────────────────────────
function openExerciseDetail(id) {
  const exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
  const exercise = exercises.find(e => e.id === id);
  if (!exercise) return;

  currentDetailId = id;
  document.getElementById("exercise-detail").style.display = "block";
  document.getElementById("workout-screen").style.display = "none";
  document.getElementById("home").style.display = "none";

  const detailTitle = document.getElementById("detail-title");
  const detailImg = document.getElementById("detail-img");
  if(detailTitle) detailTitle.textContent = exercise.name;
  if(detailImg) detailImg.src = exercise.image || '';

  renderDetailLogs(exercise);
  renderWeightChart(exercise);
}

// Torna alla lista principale
function goBackHome() {
  document.getElementById("exercise-detail").style.display = "none";
  document.getElementById("workout-screen").style.display = "block";
  loadSavedExercises();
}

// ────────────────────────────────
// Render log storico con icone modifica/elimina
// ────────────────────────────────
function renderDetailLogs(exercise) {
  const list = document.getElementById("detail-logs");
  if(!list) return;
  list.innerHTML = "";

  if (!exercise.logs.length) { 
    list.innerHTML = "<li>Nessun record salvato.</li>"; 
    return; 
  }

  exercise.logs.forEach((log, index) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const text = document.createElement("span");
    text.textContent = `Serie ${log.sets} x ${log.reps} | ${log.weight}kg | (${log.method}) • ${new Date(log.dateIso).toLocaleDateString()}`;
    li.appendChild(text);

    const icons = document.createElement("div");
    icons.style.display = "flex";
    icons.style.gap = "10px";

    // Modifica
    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️";
    editBtn.className = "log-btn log-btn-edit";
    editBtn.title = "Modifica record";
  
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const newSets = prompt("Serie:", log.sets) || log.sets;
      const newReps = prompt("Ripetizioni:", log.reps) || log.reps;
      const newWeight = prompt("Peso (kg):", log.weight) || log.weight;
      const newMethod = prompt("Metodo:", log.method) || log.method;

      log.sets = Number(newSets);
      log.reps = Number(newReps);
      log.weight = Number(newWeight);
      log.method = newMethod;

      const exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
      localStorage.setItem("myExercises", JSON.stringify(exercises));
      renderDetailLogs(exercise);
      renderWeightChart(exercise);
      loadSavedExercises();
    });

    // Elimina
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "🗑";
     delBtn.className = "log-btn log-btn-delete";
    delBtn.title = "Elimina record";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if(confirm("Eliminare questo record?")){
        exercise.logs.splice(index, 1);
        const exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
        localStorage.setItem("myExercises", JSON.stringify(exercises));
        renderDetailLogs(exercise);
        renderWeightChart(exercise);
        loadSavedExercises();
      }
    });

    icons.appendChild(editBtn);
    icons.appendChild(delBtn);
    li.appendChild(icons);

    list.appendChild(li);
  });
}

// ────────────────────────────────
// Render grafico andamento pesi
// ────────────────────────────────
let weightChart = null;
function renderWeightChart(exercise) {
  const canvas = document.getElementById("weightChart");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const labels = exercise.logs.map(l => new Date(l.dateIso).toLocaleDateString());
  const data = exercise.logs.map(l => l.weight);

  if (weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso (kg)',
        data,
        borderColor: '#00ff66',
        backgroundColor: 'rgba(0,255,102,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ────────────────────────────────
// Form nuovo record dettaglio
// ────────────────────────────────
const detailForm = document.getElementById("detail-form");
if(detailForm){
  detailForm.addEventListener("submit", e => {
    e.preventDefault();
    const form = e.target;
    const sets = Number(form.sets.value);
    const reps = Number(form.reps.value);
    const weight = Number(form.weight.value);
    const method = form.method.value;

    let exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
    const exercise = exercises.find(e => e.id === currentDetailId);
    if (!exercise) return;

    exercise.logs.push({ sets, reps, weight, method, dateIso: new Date().toISOString() });
    localStorage.setItem("myExercises", JSON.stringify(exercises));

    form.reset();
    renderDetailLogs(exercise);
    renderWeightChart(exercise);
    loadSavedExercises();
    updateWeekGraph();
  });
}

// ────────────────────────────────
// Elimina esercizio
// ────────────────────────────────
function deleteCurrentExercise() {
  if (!confirm("Eliminare questo esercizio?")) return;
  let exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
  exercises = exercises.filter(e => e.id !== currentDetailId);
  localStorage.setItem("myExercises", JSON.stringify(exercises));
  goBackHome();
  updateWeekGraph();
}

// ────────────────────────────────
// Grafico settimanale
// ────────────────────────────────
function updateWeekGraph() {
  for (let i=1; i<=7; i++) {
    const el = document.getElementById("day-"+i);
    if(el) el.classList.remove("active");
  }

  const exercises = JSON.parse(localStorage.getItem("myExercises")) || [];
  exercises.forEach(ex => {
    (ex.logs || []).forEach(l => {
      const d = new Date(l.dateIso);
      let jsDay = d.getDay(); 
      let dayIndex = jsDay===0 ? 7 : jsDay;
      const el = document.getElementById("day-"+dayIndex);
      if(el) el.classList.add("active");
    });
  });
}

// ────────────────────────────────
// Menu utente
// ────────────────────────────────
function closeUserMenu(){ document.getElementById("user-menu").classList.remove("open"); }
function changeUsername(){
  const username = prompt("Inserisci il nuovo nome:");
  if(username){ 
    localStorage.setItem("username", username); 
    const welcomeEl = document.getElementById("welcome-text");
    if(welcomeEl) welcomeEl.textContent = "Benvenuto "+username+"!";
  }
}
function deleteProfile(){
  if(confirm("Elimina tutti gli allenamenti?")){
    localStorage.removeItem("myExercises");
    updateWeekGraph();
    loadSavedExercises();
  }
}
function clearAllData(){
  if(confirm("Eliminare tutto?")){ localStorage.clear(); location.reload(); }
}

// ────────────────────────────────
// Export / Import dati
// ────────────────────────────────
function exportData() {
  const data = localStorage.getItem("myExercises") || "[]";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fitup_exercises.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          localStorage.setItem("myExercises", JSON.stringify(imported));
          alert("Dati importati correttamente!");
          loadSavedExercises();
          updateWeekGraph();
        } else {
          alert("File JSON non valido!");
        }
      } catch(err) {
        alert("Errore durante l'import: " + err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
