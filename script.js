let currentSong = new Audio();
let songs = [];
let currFolder = "";
let transitionInterval = null;
let currentSongFolder = "";
let currentSongList = [];
let playingSong;
let previousVolume = 100;

function secondsToMS(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secondsLeft = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    const encodedFolder = encodeURIComponent(folder).replace(/%2F/g, "/");
    const res = await fetch(`/assets/${encodedFolder}/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    const as = div.getElementsByTagName("a");
    songs = [];

    for (let i = 0; i < as.length; i++) {
        const href = as[i].href;
        if (href.endsWith(".mp3")) {
            const parts = href.split("/");
            const fileName = decodeURIComponent(parts[parts.length - 1]);
            songs.push(fileName);
        }
    }

    updateSongListUI(songs, folder);
}

function updateSongListUI(songs, folder) {
    const ul = document.querySelector(".songList ul");
    ul.innerHTML = "";

    for (let song of songs) {
        const isPlaying = playingSong === song.replace(".mp3", "");
        ul.innerHTML += `
            <li>
                <div class="playNow">
                    <img id="musicPlayingGif" class="${isPlaying ? 'gif' : 'svg'}" src="${isPlaying ? 'assets/gif/musicplaying.gif' : 'assets/svg/play.svg'}" alt="Music Status">

                </div>
                <div class="info">${song.replace(".mp3", "")}</div>
            </li>`;
    }

    Array.from(document.querySelectorAll(".songList li")).forEach((el, index) => {
        el.addEventListener("click", () => {
            playMusic(songs[index], folder, songs, false, true); // UI update true
        });
    });
}

function updatePlayingIcon() {
    document.querySelectorAll(".songList li").forEach(li => {
        const infoText = li.querySelector(".info").textContent;
        const playImg = li.querySelector(".playNow img");

        if (infoText === playingSong) {
            playImg.src = "assets/gif/musicplaying.gif";
            playImg.id = "musicPlayingGif";
            playImg.className = "gif";
            console.log("gif");
        } else {
            playImg.src = "assets/svg/play.svg";
            playImg.removeAttribute("id");
            playImg.className = "svg";
            console.log("svg");
        }
    });
}


function playMusic(songName, folder, songList, pause = false, shouldUpdateUI = false) {
    if (!songName) return;

    const encodedSong = encodeURIComponent(songName);
    const encodedFolder = encodeURIComponent(folder).replace(/%2F/g, "/");

    currentSong.src = `/assets/${encodedFolder}/${encodedSong}`;
    currentSongFolder = folder;
    currentSongList = songList;
    playingSong = songName.replace(".mp3", "");

    document.querySelector(".songinfo").textContent = playingSong;
    document.querySelector(".songtime").textContent = "00:00 / 00:00";

    if (shouldUpdateUI) {
        updateSongListUI(songList, folder);
    } else {
        updatePlayingIcon();
    }

    if (!pause) {
        currentSong.play().then(() => {
            play.src = "assets/svg/pause.svg";
        }).catch((err) => {
            console.warn("Playback prevented:", err);
        });
    }
}

async function displayAllAlbums() {
    const res = await fetch(`/assets/Songs/`);
    const html = await res.text();
    const div = document.createElement("div");
    div.innerHTML = html;

    const anchors = div.getElementsByTagName("a");
    const cardContainer = document.querySelector(".cardContainer");

    for (let a of anchors) {
        if (a.href.includes("/Songs")) {
            const folder = decodeURIComponent(a.href.split("/").slice(-2)[0]);
            const encodedFolder = encodeURIComponent(folder);
            try {
                const infoRes = await fetch(`/assets/Songs/${encodedFolder}/info.json`);
                const info = await infoRes.json();

                cardContainer.innerHTML += `
                    <div class="card" data-folder="${folder}">
                        <div class="play">
                            <img src="assets/svg/playButton.svg" alt="">
                        </div>
                        <img class="cardimage" src="/assets/Songs/${encodedFolder}/${info.cover}" alt="">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>`;
            } catch (e) {
                console.warn("Error fetching info.json for folder:", folder);
            }
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = "Songs/" + card.dataset.folder;
            document.getElementById("nameofsong").textContent = folder.split("/")[1];
            document.title = `GetMusic - ${folder.split("/")[1]}`;
            await getSongs(folder);
        });
    });
}

function mutemusic() {
    clearInterval(transitionInterval);

    let currentValue = Number(volumeSlider.value);

    if (currentValue !== 0) {
        previousVolume = currentValue;
        const step = currentValue / 10;
        transitionInterval = setInterval(() => {
            currentValue -= step;
            if (currentValue <= 0) {
                currentValue = 0;
                clearInterval(transitionInterval);
                volumeIcon.src = "assets/svg/mute.svg";
            }
            volumeSlider.value = Math.round(currentValue);
            currentSong.volume = currentValue / 100;
        }, 50);
    } else {
        let targetVolume = previousVolume;
        const step = targetVolume / 10;

        transitionInterval = setInterval(() => {
            currentValue += step;
            if (currentValue >= targetVolume) {
                currentValue = targetVolume;
                clearInterval(transitionInterval);
                volumeIcon.src = targetVolume < 50 ? "assets/svg/vollow.svg" : "assets/svg/volume.svg";
            }
            volumeSlider.value = Math.round(currentValue);
            currentSong.volume = currentValue / 100;
        }, 50);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    volumeSlider = document.getElementById("volumeSlider");
    volumeIcon = document.querySelector(".imagevol img");

    currentSong.volume = 1.0;
    volumeSlider.value = 100;

    volumeSlider.addEventListener("input", () => {
        const volumeValue = Number(volumeSlider.value);
        if (volumeValue !== 0) previousVolume = volumeValue;

        currentSong.volume = volumeValue / 100;

        if (volumeValue === 0) {
            volumeIcon.src = "assets/svg/mute.svg";
        } else if (volumeValue < 50) {
            volumeIcon.src = "assets/svg/vollow.svg";
        } else {
            volumeIcon.src = "assets/svg/volume.svg";
        }
    });

    volumeIcon.addEventListener("click", () => {
        mutemusic();
    });
});

async function main() {
    const res = await fetch(`/assets/Songs/`);
    const html = await res.text();
    const div = document.createElement("div");
    div.innerHTML = html;

    const folders = Array.from(div.getElementsByTagName("a"))
        .filter(a => a.href.includes("/Songs"))
        .map(a => decodeURIComponent(a.href.split("/").slice(-2)[0]));

    const random = folders[Math.floor(Math.random() * folders.length)];
    await getSongs("Songs/" + random);
    document.getElementById("nameofsong").textContent = random;

    if (songs.length > 0) {
        playMusic(songs[0], currFolder, songs, true, false);
    }

    displayAllAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "assets/svg/pause.svg";
        } else {
            currentSong.pause();
            play.src = "assets/svg/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        const current = secondsToMS(currentSong.currentTime);
        const total = secondsToMS(currentSong.duration || 0);
        document.querySelector(".songtime").textContent = `${current} / ${total}`;
        document.querySelector(".circle").style.left =
            `${(currentSong.currentTime / currentSong.duration) * 99.5 - 0.5}%`;
    });

    currentSong.addEventListener("ended", () => {
        const current = decodeURIComponent(currentSong.src.split("/").pop());
        const index = currentSongList.indexOf(current);
        const nextIndex = (index + 1) % currentSongList.length;
        playMusic(currentSongList[nextIndex], currentSongFolder, currentSongList, false, false);
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = e.offsetX / e.currentTarget.clientWidth;
        currentSong.currentTime = percent * currentSong.duration;
    });

    next.addEventListener("click", () => {
        const current = decodeURIComponent(currentSong.src.split("/").pop());
        const index = currentSongList.indexOf(current);
        const nextIndex = (index + 1) % currentSongList.length;
        playMusic(currentSongList[nextIndex], currentSongFolder, currentSongList, false, false);
    });

    prev.addEventListener("click", () => {
        const now = Date.now();
        const current = decodeURIComponent(currentSong.src.split("/").pop());
        const index = currentSongList.indexOf(current);

        if (now - lastPrevPressTime < 2000) {
            const prevIndex = index > 0 ? index - 1 : currentSongList.length - 1;
            playMusic(currentSongList[prevIndex], currentSongFolder, currentSongList, false, false);
        } else {
            currentSong.currentTime = 0;
            currentSong.play();
        }

        lastPrevPressTime = now;
    });

    let lastPrevPressTime = 0;

    document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();

        switch (key) {
            case " ":
                e.preventDefault();
                if (currentSong.paused) {
                    currentSong.play();
                    play.src = "assets/svg/pause.svg";
                } else {
                    currentSong.pause();
                    play.src = "assets/svg/play.svg";
                }
                break;

            case "arrowright":
                {
                    const current = decodeURIComponent(currentSong.src.split("/").pop());
                    const index = currentSongList.indexOf(current);
                    const nextIndex = (index + 1) % currentSongList.length;
                    playMusic(currentSongList[nextIndex], currentSongFolder, currentSongList, false, false);
                }
                break;

            case "arrowleft":
                {
                    const now = Date.now();
                    const current = decodeURIComponent(currentSong.src.split("/").pop());
                    const index = currentSongList.indexOf(current);

                    if (now - lastPrevPressTime < 2000) {
                        const prevIndex = index > 0 ? index - 1 : currentSongList.length - 1;
                        playMusic(currentSongList[prevIndex], currentSongFolder, currentSongList, false, false);
                    } else {
                        currentSong.currentTime = 0;
                        currentSong.play();
                    }

                    lastPrevPressTime = now;
                }
                break;

            case "m":
                mutemusic();
                break;
        }
    });
}

main();
