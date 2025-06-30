// UI Helpers for Pig Game (shared by single and multiplayer)

export function showDiceAnimation(finalDice, onComplete, diceEl = document.querySelector('.dice')) {
  let rollCount = 0;
  diceEl.classList.remove('hidden');
  const diceRollInterval = setInterval(() => {
    const randomDice = Math.trunc(Math.random() * 6) + 1;
    diceEl.src = `./img/dice-${randomDice}.png`;
    rollCount++;
    if (rollCount >= 10) {
      clearInterval(diceRollInterval);
      diceEl.src = `./img/dice-${finalDice}.png`;
      setTimeout(() => {
        if (typeof onComplete === 'function') onComplete();
      }, 300);
    }
  }, 100);
}

export function showPlayerSwitchGif(activePlayer, onComplete) {
  const nextPlayerGif0 = document.querySelector('.nextGif');
  const nextPlayerGif1 = document.querySelector('.nextGif2');
  if (activePlayer === 0) {
    nextPlayerGif0.classList.remove('hidden');
    setTimeout(() => {
      nextPlayerGif0.classList.add('hidden');
      if (typeof onComplete === 'function') onComplete();
    }, 1500);
  } else {
    nextPlayerGif1.classList.remove('hidden');
    setTimeout(() => {
      nextPlayerGif1.classList.add('hidden');
      if (typeof onComplete === 'function') onComplete();
    }, 1500);
  }
}

// --- Modal and Loader Helpers ---
export function openModal(modal, overlay, modalBtn) {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  if (modalBtn) modalBtn.classList.add("noAnim");
}

export function closeModal(modal, overlay) {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
}

export function loadAnim(load, overlay) {
  load.classList.remove("hidden");
  overlay.classList.remove("hidden");
  setTimeout(() => {
    load.classList.add("hidden");
    overlay.classList.add("hidden");
  }, 2000);
}
