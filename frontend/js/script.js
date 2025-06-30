import { showDiceAnimation, showPlayerSwitchGif } from './uiHelpers.js';

'use strict';

// Selecting elements
const player0El = document.querySelector('.player--0');
const player1El = document.querySelector('.player--1');
const score0El = document.querySelector('#score--0');
const score1El = document.getElementById('score--1');
const current0El = document.getElementById('current--0');
const current1El = document.getElementById('current--1');

const diceEl = document.querySelector('.dice');
const btnNew = document.querySelector('.btn--new');
const btnRoll = document.querySelector('.btn--roll');
const btnHold = document.querySelector('.btn--hold');

const modalBtn = document.querySelector('.show-modal');
const modal = document.querySelector('.modal');
const overlay = document.querySelector('.modal-overlay');
const closeModalBtn = document.querySelector('.close-modal-btn');
const load = document.querySelector('#anim');
const nextPlayerGif0 = document.querySelector('.nextGif');
const nextPlayerGif1 = document.querySelector('.nextGif2');
const player1Conffeti = document.querySelector(".confetti-img1");
const player2Conffeti = document.querySelector(".confetti-img2");


let scores, currentScore, activePlayer, playing;

// Starting conditions || load animation //
const loadAnim = () => {
  load.classList.remove('hidden');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    load.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 2000);
};

const init = function () {
  loadAnim();
  scores = [0, 0];
  currentScore = 0;
  activePlayer = 0;
  playing = true;

  score0El.textContent = 0;
  score1El.textContent = 0;
  current0El.textContent = 0;
  current1El.textContent = 0;

  diceEl.classList.add('hidden');
  player0El.classList.remove('player--winner');
  player1El.classList.remove('player--winner');
  player0El.classList.add('player--active');
  player1El.classList.remove('player--active');
};

const reloadScreen = () => {
  init();
};

// --- Modified Single Player Logic to Use Helpers and Respect Multiplayer ---
const rolleDice = () => {
  if (playing && !window.isMultiplayerActive) {
    btnRoll.disabled = true;
    btnRoll.style.cursor = 'not-allowed';
    showDiceAnimation(Math.trunc(Math.random() * 6) + 1, function() {
      // 2. Generate the actual dice roll
      const dice = Math.trunc(Math.random() * 6) + 1;
      diceEl.src = `./img/dice-${dice}.png`;
      if (dice !== 1) {
        currentScore += dice;
        document.getElementById(`current--${activePlayer}`).textContent = currentScore;
        btnRoll.disabled = false;
        btnRoll.style.cursor = 'pointer';
      } else {
        showPlayerSwitchGif(activePlayer, function() {
          switchPlayer();
          btnRoll.disabled = false;
          btnRoll.style.cursor = 'pointer';
        });
      }
    });
  }
};

const holdFunction = () => {
  if (playing && !window.isMultiplayerActive) {
    scores[activePlayer] += currentScore;
    document.getElementById(`score--${activePlayer}`).textContent = scores[activePlayer];
    if (scores[activePlayer] >= 100) {
      playing = false;
      diceEl.classList.add('hidden');
      document.querySelector(`.player--${activePlayer}`).classList.add('player--winner');
      document.querySelector(`.player--${activePlayer}`).classList.remove('player--active');
      confettiDisplay(activePlayer);
    } else {
      showPlayerSwitchGif(activePlayer, function() {
        switchPlayer();
      });
    }
  }
};

const nextGiff = () => {
  // Disable Roll Dice and hold Btn

  btnRoll.disabled = true;
  btnRoll.style.cursor = 'not-allowed';
  btnHold.disabled = true;
  btnHold.style.cursor = 'not-allowed';

  if (activePlayer === 0) {
    // Display next player animation
    nextPlayerGif0.classList.remove('hidden');

    // Hide next player animation
    setTimeout(() => {
      nextPlayerGif0.classList.add('hidden');
    }, 1500);
  } else {
    // Display next player animation
    nextPlayerGif1.classList.remove('hidden');

    // Hide next player animation
    setTimeout(() => {
      nextPlayerGif1.classList.add('hidden');
    }, 1500);
  }

  // Re-Enable Btn if no player has won
  setTimeout(() => {
    btnRoll.disabled = false;
    btnRoll.style.cursor = 'pointer';
    btnHold.disabled = false;
    btnHold.style.cursor = 'pointer';
  }, 1500);
};

const switchPlayer = function () {
  nextGiff();
  document.getElementById(`current--${activePlayer}`).textContent = 0;
  currentScore = 0;
  activePlayer = activePlayer === 0 ? 1 : 0;
  player0El.classList.toggle('player--active');
  player1El.classList.toggle('player--active');
};

// Confetti Display for winner & Ui Update
// const confettiDisplay = function (num) {
//   if (num === 0) {
//     player1Conffeti.classList.remove("hidden");
//     player1Active.classList.add("player--winner");
//   } else {
//     player2Conffeti.classList.remove("hidden");
//     player2Active.classList.add("player--winner");
//   }
// };

const confettiDisplay = function (num) {
  if (num === 0) {
    player1Conffeti.classList.remove("hidden");
  } else {
    player2Conffeti.classList.remove("hidden");
  }

  // Hide confetti after a delay
  setTimeout(() => {
    player1Conffeti.classList.add("hidden");
    player2Conffeti.classList.add("hidden");
  }, 3000); // Confetti visible for 3 seconds
};

// Open Molal
const openModal = function () {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  modalBtn.classList.add('noAnim');
};

// Close Modal
const closeModal = function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
};
init();


// load animation on window load
document.addEventListener('load', loadAnim());

// Event Listeners
// Open Modal On Click
modalBtn.addEventListener('click', openModal);

// Close Modal On Click
closeModalBtn.addEventListener('click', closeModal);

// Close Modal On Overlay click
overlay.addEventListener('click', closeModal);

// Rolling dice functionality
btnRoll.addEventListener('click', rolleDice);

btnHold.addEventListener('click', holdFunction);

btnNew.addEventListener('click', init);

// KEY EVENTS //
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    reloadScreen();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'h') {
    holdFunction();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'r') {
    rolleDice();
  }
});
// KEY EVENTS //

window.isMultiplayerActive = false;
window.rolleDice = rolleDice;
window.holdFunction = holdFunction;
