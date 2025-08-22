let currentMuscle = "";

// Al primo accesso chiedi nome
document.addEventListener("DOMContentLoaded", () => {
  let username = localStorage.getItem("username");
  if (!username) {
    username = prompt("Inserisci il tuo nome:");
    if (username) {
      localStorage.setItem("username", username);
    } else {
      username = "Atleta";
    }
  }
  document.getElementById("welcome-text").textContent = "Benvenuto " + username + "!";

  updateWeekGraph(); // aggiorna grafico
  loadExercises();
});

// Apri schermata allenamento
function openWorkout(muscle) {
  currentMuscle = muscle;
  document.getElementById("home").style.display = "none";
  document.getElementById("workout-screen").style.display = "block";

  document.getElementById("workout-title").textContent =
    "Allenamento " + muscle.toUpperCase();

  loadExercises();
}

// Torna alla home
function goHome() {
  document.getElementById("workout-screen").style.display = "none";
  document.getElementById("home").style.display = "grid";
  updateWeekGraph();
}

// Aggiungi esercizio
function addExercise() {
  let exercise = document.getElementById("exercise").value;
  let sets = document.getElementById("sets").value;
  let reps = document.getElementById("reps").value;
  let weight = document.getElementById("weight").value;

  if (!exercise || !sets || !reps || !weight) {
    alert("Inserisci tutti i campi!");
    return;
  }

  let workouts = JSON.parse(localStorage.getItem(currentMuscle)) || [];

  let newEntry = {
    id: Date.now(), // id univoco
    exercise,
    sets,
    reps,
    weight,
    date: new Date().toISOString() // salvo ISO per gestire bene le date
  };

  workouts.push(newEntry);
  localStorage.setItem(currentMuscle, JSON.stringify(workouts));

  displayExercise(newEntry);
  updateWeekGraph(); // aggiorna grafico settimanale

  // reset campi
  document.getElementById("exercise").value = "";
  document.getElementById("sets").value = "";
  document.getElementById("reps").value = "";
  document.getElementById("weight").value = "";
}

// Carica esercizi salvati
function loadExercises() {
  if (!currentMuscle) return;
  let list = document.getElementById("log-list");
  list.innerHTML = "";

  let workouts = JSON.parse(localStorage.getItem(currentMuscle)) || [];
  workouts.forEach(displayExercise);
}

// Mostra esercizio
function displayExercise(entry) {
  let list = document.getElementById("log-list");
  let item = document.createElement("li");

  let dateObj = new Date(entry.date);
  let dateString = dateObj.toLocaleDateString();

  item.innerHTML = `
    ${dateString} - ${entry.exercise}: ${entry.sets}x${entry.reps} @ ${entry.weight}kg
    <div>
      <button onclick="editExercise(${entry.id})">✏</button>
      <button onclick="deleteExercise(${entry.id})">🗑</button>
    </div>
  `;
  list.appendChild(item);
}

// Elimina esercizio
function deleteExercise(id) {
  let workouts = JSON.parse(localStorage.getItem(currentMuscle)) || [];
  workouts = workouts.filter(entry => entry.id !== id);
  localStorage.setItem(currentMuscle, JSON.stringify(workouts));
  loadExercises();
  updateWeekGraph();
}

// Modifica esercizio
function editExercise(id) {
  let workouts = JSON.parse(localStorage.getItem(currentMuscle)) || [];
  let entry = workouts.find(e => e.id === id);

  if (entry) {
    document.getElementById("exercise").value = entry.exercise;
    document.getElementById("sets").value = entry.sets;
    document.getElementById("reps").value = entry.reps;
    document.getElementById("weight").value = entry.weight;

    // elimino il vecchio record (poi sarà risalvato aggiornato)
    workouts = workouts.filter(e => e.id !== id);
    localStorage.setItem(currentMuscle, JSON.stringify(workouts));
    loadExercises();
    updateWeekGraph();
  }
}

// 🔹 Funzione grafico settimanale
function updateWeekGraph() {
  // reset giorni
  for (let i = 1; i <= 7; i++) {
    document.getElementById("day-" + i).classList.remove("active");
  }

  // ottieni TUTTI i dati di tutti i muscoli
  let muscles = ["chest", "back", "leg", "shoulders"];
  let allWorkouts = [];

  muscles.forEach(muscle => {
    let data = JSON.parse(localStorage.getItem(muscle)) || [];
    allWorkouts = allWorkouts.concat(data);
  });

  // segna i giorni in cui c'è almeno un allenamento
  allWorkouts.forEach(entry => {
    let date = new Date(entry.date);
    let day = date.getDay(); // 0=dom, 1=lun ...
    let dayIndex = day === 0 ? 7 : day; // domenica = 7
    document.getElementById("day-" + dayIndex).classList.add("active");
  });
}
// 🔹 Apri menu quando clicchi sul logo
document.querySelector(".logo").addEventListener("click", () => {
  document.getElementById("user-menu").classList.add("open");
});

// 🔹 Chiudi menu (clic su X)
function closeUserMenu() {
  document.getElementById("user-menu").classList.remove("open");
}

// 🔹 Modifica nome utente
function changeUsername() {
  let username = prompt("Inserisci il nuovo nome:");
  if (username) {
    localStorage.setItem("username", username);
    document.getElementById("welcome-text").textContent = "Benvenuto " + username + "!";
  }
}

// 🔹 Elimina profilo (nome utente + allenamenti muscoli)
function deleteProfile() {
  if (confirm("Sei sicuro di voler eliminare i tuoi allenamenti?")) {
    let muscles = ["chest", "back", "leg", "shoulders"];
    muscles.forEach(m => localStorage.removeItem(m));
    location.reload();
  }
}

// 🔹 Elimina tutti i dati
function clearAllData() {
  if (confirm("Eliminare tutti i dati salvati?")) {
    localStorage.clear();
    location.reload();
  }
}

// 🔹 Esporta dati in JSON
function exportData() {
  let data = JSON.stringify(localStorage);
  let blob = new Blob([data], {type: "application/json"});
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "fitup_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// 🔹 Importa dati da file JSON
function importData() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e => {
    let file = e.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = event => {
      try {
        let imported = JSON.parse(event.target.result);
        for (let key in imported) {
          localStorage.setItem(key, imported[key]);
        }
        alert("Dati importati con successo!");
        location.reload();
      } catch (err) {
        alert("Errore nel file di importazione!");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
