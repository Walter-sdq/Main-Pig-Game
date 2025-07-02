// SoundManager for Pig Game Multiplayer
// Place your sound files in frontend/sounds/ (or update paths below)

// Use online game sound URLs
export const sounds = {
  dice: new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6b6b6.mp3'), // dice roll
  hold: new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6b6b7.mp3'), // hold (replace with a suitable sound)
  win: new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6b6b8.mp3'), // win (replace with a suitable sound)
  click: new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6b6b9.mp3'), // click (replace with a suitable sound)
  music: new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6b6c0.mp3'), // background music (replace with a suitable sound)
};

// Loop background music
typeof sounds.music.loop !== 'undefined' ? (sounds.music.loop = true) : sounds.music.addEventListener('ended', function() { this.currentTime = 0; this.play(); });

let muted = false;
let playMode = 'both'; // 'single', 'multiplayer', or 'both' (default: both)

export function setPlayMode(mode) {
  playMode = mode;
}

export function playSound(name, mode = 'multiplayer') {
  if (muted) return;
  // Always allow playback in any mode if playMode is 'both'
  if (playMode !== 'both' && playMode !== mode) return;
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

export function playMusic(mode = 'multiplayer') {
  if (muted) return;
  // Always allow playback in any mode if playMode is 'both'
  if (playMode !== 'both' && playMode !== mode) return;
  sounds.music.play();
}

export function pauseMusic() {
  sounds.music.pause();
}

export function toggleMute() {
  muted = !muted;
  if (muted) pauseMusic();
  else playMusic();
  return muted;
}

export function isMuted() {
  return muted;
}
