let songs = [];
let currentSong = new Audio();
let currfolder;

const play = document.querySelector("#play");
const progressBar = document.querySelector("#progress");
const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");
const songTimeDisplay = document.querySelector(".songtime");
const songListElement = document.querySelector(".songlist");
const cardcontainer = document.querySelector(".cardcontainer");

function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  if (secs < 10) secs = "0" + secs;
  if (mins < 10) mins = "0" + mins;
  return `${mins}:${secs}`;
}

async function getSongs(folder) {
  currfolder = folder;
  let res = await fetch(`/songs/${folder}`);
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let as = div.getElementsByTagName("a");

  songs = [];
  for (let a of as) {
    if (a.href.endsWith(".mp3")) {
      songs.push(decodeURIComponent(a.href.split(`/${folder}/`)[1]));
    }
  }

  let songUL = songListElement.querySelector("ul");
  if (!songUL) return;

  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML += `
      <li class="song-item">
        <img src="music.svg" alt="icon">
        <div class="info">
          <div>${song.replace(".mp3", "")}</div>
          <div class="artist">song Artist</div>
        </div>
        <img src="playlib.svg" alt="play" class="libplaybutton">
      </li>`;
  }

  Array.from(songListElement.querySelectorAll("li")).forEach(e => {
    e.addEventListener("click", () => {
      let trackName = e.querySelector(".info").firstElementChild.innerText.trim() + ".mp3";
      playMusic(trackName);
    });
  });
}

function playMusic(track) {
  if (!currentSong.paused) currentSong.pause();

  currentSong.src = `/songs/${currfolder}/${track}`;
  currentSong.play();

  play.src = "pause.svg";
  document.querySelector(".songinfo").innerText = track.replace(".mp3", "");
  songTimeDisplay.innerHTML = "";

  currentSong.addEventListener("loadedmetadata", () => {
    const durationFormatted = formatTime(currentSong.duration);
    songTimeDisplay.innerHTML = `00:00 / ${durationFormatted}`;
  });
}

async function displayalbum() {
  let res = await fetch(`/songs/`);
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let anchors = div.getElementsByTagName("a");

  cardcontainer.innerHTML = "";

  for (let a of anchors) {
    if (a.href.includes("/songs")) {
      let folder = a.href.split("/").slice(-2)[0];
      try {
        let infoRes = await fetch(`/songs/${folder}/info.json`);
        let info = await infoRes.json();

        cardcontainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="play">
              <circle cx="50" cy="50" r="48" stroke="black" stroke-width="4" fill="darkblue" />
              <polygon points="40,30 70,50 40,70" fill="orange" />
            </svg>
            <img src="/songs/${folder}/cover.jpeg" alt="Cover for ${info.title}">
            <h2>${info.title}</h2>
            <p>${info.description}</p>
          </div>`;
      } catch (err) {
        console.warn(`Skipping album ${folder} due to missing info.json`);
      }
    }
  }

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", async (e) => {
      if (e.target.closest(".play")) return; // Ignore if play button clicked
      await getSongs(card.dataset.folder);
    });
  });

  // **Added code: play first song on clicking play button inside album card**
  document.querySelectorAll(".card .play").forEach(playBtn => {
    playBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // prevent triggering the card's click event
      const card = playBtn.closest(".card");
      const folder = card.dataset.folder;
      await getSongs(folder);
      if (songs.length > 0) {
        playMusic(songs[0]); // play first song of the album
      }
    });
  });
}

play.addEventListener("click", () => {
  if (currentSong.paused) {
    currentSong.play();
    play.src = "pause.svg";
  } else {
    currentSong.pause();
    play.src = "playbutton.png";
  }
});

currentSong.addEventListener("timeupdate", () => {
  if (!isNaN(currentSong.duration)) {
    let currentFormatted = formatTime(currentSong.currentTime);
    let durationFormatted = formatTime(currentSong.duration);
    songTimeDisplay.innerHTML = `${currentFormatted} / ${durationFormatted}`;

    let progress = (currentSong.currentTime / currentSong.duration) * 100;
    progressBar.style.width = `${progress}%`;
    circle.style.left = `${progress}%`;
  }
});

seekbar.addEventListener("click", (e) => {
  const rect = seekbar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  currentSong.currentTime = percent * currentSong.duration;
});

document.querySelector(".hamburger").addEventListener("click", () => {
  document.querySelector(".left").style.left = "0";
});

document.querySelector(".close").addEventListener("click", () => {
  document.querySelector(".left").style.left = "-100%";
});

document.querySelector("#previous").addEventListener("click", () => {
  let current = currentSong.src.split("/").pop();
  let index = songs.indexOf(current);
  if (index > 0) playMusic(songs[index - 1]);
});

document.querySelector("#next").addEventListener("click", () => {
  if (songs.length === 0) return;
  let current = currentSong.src.split("/").pop();
  let index = songs.indexOf(current);
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * songs.length);
  } while (nextIndex === index && songs.length > 1);
  playMusic(songs[nextIndex]);
});

currentSong.addEventListener("ended", () => {
  document.querySelector("#next").click();
});

let volumeInput = document.querySelector(".range input");
if (volumeInput) {
  volumeInput.addEventListener("input", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });
}

async function main() {
  await displayalbum();
  await getSongs("ncs");
}
main();
