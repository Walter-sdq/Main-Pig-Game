import { playSound, playMusic, pauseMusic, toggleMute, isMuted, setPlayMode } from './soundManager.js';

// Multiplayer client for Pig Game
class MultiplayerClient {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.playerName = null;
    this.gameId = null;
    this.isConnected = false;
    this.gameState = null;
    this.isSpectating = false;
    this.pendingRequestFrom = null;

    this.initializeUI();
  }

  initializeUI() {
    setPlayMode('multiplayer');
    this.createMultiplayerModal();
    this.createGameRequestModal();
    this.createGamePanel();
    this.addMultiplayerButton();
    this.setupEventListeners();
    this.addSoundToggleButton();
  }

  createMultiplayerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal multiplayer-modal hidden';
    modal.innerHTML = `
      <button class="close-modal-btn multiplayer-close">&times;</button>
      <h2>🌐 Multiplayer Lobby</h2>
      <div class="connection-status">
        <div class="status-indicator offline"></div>
        <span class="status-text">Disconnected</span>
      </div>
      <div class="player-setup">
        <input type="text" id="player-name" placeholder="Enter your name" maxlength="20">
        <input type="text" id="player-id" placeholder="Custom ID (optional)" maxlength="4">
        <div class="avatar-picker" style="display: flex; gap: 1rem; margin: 1rem 0; justify-content: center;">
          <label>Select Avatar:</label>
          <span class="avatar-option" data-avatar="🐷" style="font-size:2.5rem;cursor:pointer;">🐷</span>
          <span class="avatar-option" data-avatar="🐸" style="font-size:2.5rem;cursor:pointer;">🐸</span>
          <span class="avatar-option" data-avatar="🦊" style="font-size:2.5rem;cursor:pointer;">🦊</span>
          <span class="avatar-option" data-avatar="🐼" style="font-size:2.5rem;cursor:pointer;">🐼</span>
          <span class="avatar-option" data-avatar="🦁" style="font-size:2.5rem;cursor:pointer;">🦁</span>
          <span class="avatar-option" data-avatar="👾" style="font-size:2.5rem;cursor:pointer;">👾</span>
        </div>
        <input type="hidden" id="player-avatar" value="🐷">
        <button id="connect-btn">Connect to Lobby</button>
      </div>
      <div class="lobby-content hidden">
        <div class="player-info">
          <span>You are: <strong id="current-player-info"></strong></span>
        </div>
        <div class="online-players">
          <h3>Online Players</h3>
          <div id="players-list">No other players online</div>
        </div>
        <div class="active-games">
          <h3>Active Games (Click to Watch)</h3>
          <div id="games-list">No active games</div>
        </div>
        <div class="leaderboard-section">
          <h3>🏆 Leaderboard</h3>
          <div id="leaderboard-list">Loading...</div>
        </div>
      </div>
    `;
    document.querySelector('main').appendChild(modal);
  }

  createGameRequestModal() {
    const modal = document.createElement('div');
    modal.className = 'modal game-request-modal hidden';
    modal.innerHTML = `
      <h2>🎮 Game Request</h2>
      <p id="request-message"></p>
      <div class="request-buttons">
        <button id="accept-request" class="btn-accept">Accept</button>
        <button id="decline-request" class="btn-decline">Decline</button>
      </div>
    `;

    document.querySelector('main').appendChild(modal);
  }

  createGamePanel() {
    const panel = document.createElement('div');
    panel.className = 'game-panel hidden';
    panel.innerHTML = `
      <div class="panel-header">
        <h3 id="game-title">Game Info</h3>
        <button id="leave-game-btn">Leave Game</button>
      </div>
      <div class="game-info">
        <div class="player-info-card">
          <span id="opponent-name">Opponent</span>
          <span id="game-status">Waiting...</span>
        </div>
      </div>
    `;

    document.querySelector('main').appendChild(panel);
  }

  addMultiplayerButton() {
    const button = document.createElement('button');
    button.className = 'btn multiplayer-btn';
    button.innerHTML = '🌐 Multiplayer';
    button.style.cssText = `
      position: absolute;
      top: 4rem;
      right: 4rem;
    `;

    document.querySelector('main').appendChild(button);
  }

  addSoundToggleButton() {
    const modal = document.querySelector('.multiplayer-modal');
    if (!modal || modal.querySelector('.sound-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'sound-toggle-btn';
    btn.innerHTML = isMuted() ? '🔇 Music Off' : '🎵 Music On';
    btn.style.cssText = 'position:absolute;top:1.2rem;right:2.5rem;font-size:1.3rem;padding:0.4rem 1.2rem;border-radius:0.5rem;background:#f3f4f6;border:none;cursor:pointer;z-index:1200;';
    btn.onclick = () => {
      const muted = toggleMute();
      btn.innerHTML = muted ? '🔇 Music Off' : '🎵 Music On';
    };
    modal.appendChild(btn);
  }

  setupEventListeners() {
    // Multiplayer button
    document.querySelector('.multiplayer-btn').addEventListener('click', () => {
      this.openMultiplayerModal();
    });

    // Connect button
    document.getElementById('connect-btn').addEventListener('click', () => {
      this.connectToLobby();
    });

    // Close modal buttons
    document
      .querySelector('.multiplayer-close')
      .addEventListener('click', () => {
        this.closeMultiplayerModal();
      });

    // Game request buttons
    document.getElementById('accept-request').addEventListener('click', () => {
      this.acceptGameRequest();
    });

    document.getElementById('decline-request').addEventListener('click', () => {
      this.declineGameRequest();
    });

    // Leave game button
    document.getElementById('leave-game-btn').addEventListener('click', () => {
      this.leaveGame();
    });
  }

  connectToLobby() {
    const playerName = document.getElementById('player-name').value.trim();
    const playerId = document.getElementById('player-id').value.trim().toUpperCase();
    const avatar = document.getElementById('player-avatar').value;
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    this.socket = io(window.location.origin);
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.updateConnectionStatus(true);
      this.socket.emit('join_lobby', {
        playerName: playerName,
        playerId: playerId || null,
        avatar: avatar || null
      });
    });

    this.socket.on('join_success', player => {
      this.playerId = player.id;
      this.playerName = player.name;
      document.getElementById('current-player-info').textContent = `${player.name} (${player.id})`;
      document.querySelector('.player-setup').classList.add('hidden');
      document.querySelector('.lobby-content').classList.remove('hidden');
      this.fetchLeaderboard();
      playMusic('multiplayer');
    });

    this.socket.on('players_update', players => {
      this.updatePlayersList(players);
    });

    this.socket.on('games_update', games => {
      this.updateGamesList(games);
    });

    this.socket.on('game_request', data => {
      this.showGameRequest(data);
    });

    this.socket.on('game_declined', data => {
      alert(`${data.by} declined your game request`);
    });

    this.socket.on('game_started', game => {
      this.startMultiplayerGame(game);
    });

    this.socket.on('watching_game', game => {
      this.startWatchingGame(game);
    });

    this.socket.on('dice_rolled', (result) => {
      this.handleDiceRoll(result);
    });

    this.socket.on('score_held', result => {
      this.handleScoreHeld(result);
    });

    this.socket.on('game_ended', data => {
      this.handleGameEnd(data);
      this.fetchLeaderboard();
    });

    this.socket.on('player_left', data => {
      alert(`${data.player} left the game`);
      if (data.gameEnded) {
        this.returnToLobby();
      }
    });

    this.socket.on('player_disconnected', data => {
      alert(`${data.player} disconnected`);
      this.returnToLobby();
    });

    this.socket.on('error', message => {
      alert('Error: ' + message);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.updateConnectionStatus(false);
      alert('Disconnected from server');
    });

    // Emoji reaction handling
    this.socket.on('emoji_reaction', data => {
      this.displayEmojiReaction(data);
    });
  }

  updateConnectionStatus(connected) {
    const indicator = document.querySelector('.status-indicator');
    const text = document.querySelector('.status-text');

    if (connected) {
      indicator.className = 'status-indicator online';
      text.textContent = 'Connected';
    } else {
      indicator.className = 'status-indicator offline';
      text.textContent = 'Disconnected';
    }
  }

  updatePlayersList(players) {
    const playersList = document.getElementById('players-list');
    if (players.length === 0) {
      playersList.innerHTML = 'No other players online';
      return;
    }
    playersList.innerHTML = '';
    players.forEach(player => {
      if (player.id !== this.playerId) {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
          <span class="player-avatar">${player.avatar || '👤'}</span>
          <span>${player.name} (${player.id})</span>
        `;
        const challengeBtn = document.createElement('button');
        challengeBtn.textContent = 'Challenge';
        challengeBtn.addEventListener('click', () => {
          this.requestGame(player.id);
        });
        playerElement.appendChild(challengeBtn);
        playersList.appendChild(playerElement);
      }
    });
  }

  updateGamesList(games) {
    const gamesList = document.getElementById('games-list');

    if (games.length === 0) {
      gamesList.innerHTML = 'No active games';
      return;
    }

    gamesList.innerHTML = '';
    games.forEach(game => {
      const gameElement = document.createElement('div');
      gameElement.className = 'game-item';
      gameElement.innerHTML = `
        <div class="game-info">
          <span>${game.players.join(' vs ')}</span>
          <small>Game ID: ${game.id}</small>
          <small>Watchers: ${game.watchers}</small>
        </div>
        <button onclick="multiplayerClient.watchGame('${
          game.id
        }')">Watch</button>
      `;
      gamesList.appendChild(gameElement);
    });
  }

  // Fetch and display leaderboard
  fetchLeaderboard() {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        const leaderboard = document.getElementById('leaderboard-list');
        if (!leaderboard) return;
        if (!data.length) {
          leaderboard.innerHTML = '<em>No games played yet.</em>';
          return;
        }
        leaderboard.innerHTML = `<table class="leaderboard-table" style="width:100%;text-align:left;">
          <tr><th>#</th><th>Avatar</th><th>Name</th><th>Wins</th><th>Losses</th></tr>
          ${data.map((p, i) => `<tr><td>${i+1}</td><td style='font-size:1.7rem;'>${p.avatar||'👤'}</td><td>${p.name}</td><td>${p.wins}</td><td>${p.losses}</td></tr>`).join('')}
        </table>`;
      });
  }

  requestGame(targetPlayerId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_game', targetPlayerId);
    }
  }

  watchGame(gameId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('watch_game', gameId);
    }
  }

  showGameRequest(data) {
    const modal = document.querySelector('.game-request-modal');
    const message = document.getElementById('request-message');

    message.textContent = `${data.fromName} (${data.from}) wants to play with you!`;
    modal.classList.remove('hidden');
    document.querySelector('.modal-overlay').classList.remove('hidden');

    this.pendingRequestFrom = data.from;
  }

  acceptGameRequest() {
    if (this.socket && this.pendingRequestFrom) {
      this.socket.emit('accept_game', this.pendingRequestFrom);
      this.closeGameRequestModal();
    }
  }

  declineGameRequest() {
    if (this.socket && this.pendingRequestFrom) {
      this.socket.emit('decline_game', this.pendingRequestFrom);
      this.closeGameRequestModal();
    }
  }

  startMultiplayerGame(game) {
    this.gameState = game;
    this.gameId = game.id;
    this.isSpectating = false;

    this.closeMultiplayerModal();
    this.showGamePanel(game);
    this.overrideGameControls();
    this.updateGameUI(game);
  }

  startWatchingGame(game) {
    this.gameState = game;
    this.gameId = game.id;
    this.isSpectating = true;

    this.closeMultiplayerModal();
    this.showGamePanel(game, true);
    this.disableGameControls();
    this.updateGameUI(game);
  }

  showGamePanel(game, watching = false) {
    const panel = document.querySelector('.game-panel');
    const title = document.getElementById('game-title');
    const opponentName = document.getElementById('opponent-name');
    const gameStatus = document.getElementById('game-status');

    panel.classList.remove('hidden');

    if (watching) {
      title.textContent = '👁️ Watching Game';
      opponentName.textContent = `${game.players.join(' vs ')}`;
      gameStatus.textContent = 'Spectating';
    } else {
      title.textContent = 'Playing Game';
      const opponent = game.players.find(id => id !== this.playerId);
      opponentName.textContent = `vs ${game.playerNames[opponent]}`;
      gameStatus.textContent =
        game.currentPlayer === this.playerId ? 'Your turn' : "Opponent's turn";
    }
  }

  updateGameUI(game) {
    // Update main game display
    const player1Id = game.players[0];
    const player2Id = game.players[1];

    document.getElementById('name--0').textContent =
      game.playerNames[player1Id];
    document.getElementById('name--1').textContent =
      game.playerNames[player2Id];
    document.getElementById('score--0').textContent = game.scores[player1Id];
    document.getElementById('score--1').textContent = game.scores[player2Id];
    document.getElementById('current--0').textContent =
      game.currentScores[player1Id];
    document.getElementById('current--1').textContent =
      game.currentScores[player2Id];

    // Update active player
    document
      .querySelector('.player--0')
      .classList.toggle('player--active', game.currentPlayer === player1Id);
    document
      .querySelector('.player--1')
      .classList.toggle('player--active', game.currentPlayer === player2Id);

    // Update game status
    if (!this.isSpectating) {
      const gameStatus = document.getElementById('game-status');
      gameStatus.textContent =
        game.currentPlayer === this.playerId ? 'Your turn' : "Opponent's turn";
    }
  }

  overrideGameControls() {
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');

    // When player clicks "Roll" in multiplayer mode:
    rollBtn.onclick = () => {
      if (this.isMultiplayer && this.isMyTurn()) {
        this.socket.emit('roll_dice', { gameId: this.gameId, playerId: this.playerId });
      }
    };

    holdBtn.onclick = () => {
      if (
        this.gameState &&
        this.gameState.currentPlayer === this.playerId &&
        this.gameState.playing
      ) {
        this.socket.emit('hold_score', this.gameId);
      } else {
        alert("It's not your turn!");
      }
    };
  }

  disableGameControls() {
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');

    rollBtn.disabled = true;
    holdBtn.disabled = true;
    rollBtn.style.opacity = '0.5';
    holdBtn.style.opacity = '0.5';
  }

  enableGameControls() {
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');

    rollBtn.disabled = false;
    holdBtn.disabled = false;
    rollBtn.style.opacity = '1';
    holdBtn.style.opacity = '1';
  }

  // Handle dice roll animation using only server data
  handleDiceRoll(result) {
    playSound('dice', 'multiplayer');
    const diceEl = document.querySelector('.dice');
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    const finalDice = result.dice;
    const diceSequence = result.diceSequence;

    // Animate dice using server-provided sequence
    let rollCount = 0;
    diceEl.classList.remove('hidden');
    rollBtn.disabled = true;
    holdBtn.disabled = true;
    rollBtn.style.opacity = '0.5';
    holdBtn.style.opacity = '0.5';

    const diceRollInterval = setInterval(() => {
      diceEl.src = `./img/dice-${diceSequence[rollCount]}.png`;
      rollCount++;
      if (rollCount >= diceSequence.length) {
        clearInterval(diceRollInterval);
        diceEl.src = `./img/dice-${finalDice}.png`;
        setTimeout(() => {
          this.gameState = result.game;
          this.updateGameUI(result.game);
          this.updateButtonState();
        }, 300);
      }
    }, 80);
  }

  handleScoreHeld(result) {
    playSound('hold', 'multiplayer');
    const previousPlayer = this.gameState?.currentPlayer;
    if (previousPlayer && previousPlayer !== result.game.currentPlayer) {
      this.animateTurnSwitch(result, previousPlayer);
    }
    this.gameState = result.game;
    this.updateGameUI(result.game);
    this.updateButtonState();
  }

  handleGameEnd(data) {
    playSound('win', 'multiplayer');
    this.gameState = null;
    this.gameId = null;
    this.isSpectating = false;

    document.querySelector('.game-panel').classList.add('hidden');
    this.enableGameControls();

    // Reset original game controls
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    rollBtn.onclick = window.rolleDice;
    holdBtn.onclick = window.holdFunction;

    this.openMultiplayerModal();
  }

  updateButtonState() {
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    if (
      this.gameState &&
      this.gameState.currentPlayer === this.playerId &&
      this.gameState.playing &&
      !this.isSpectating
    ) {
      rollBtn.disabled = false;
      holdBtn.disabled = false;
      rollBtn.style.opacity = '1';
      holdBtn.style.opacity = '1';
    } else {
      rollBtn.disabled = true;
      holdBtn.disabled = true;
      rollBtn.style.opacity = '0.5';
      holdBtn.style.opacity = '0.5';
    }
  }

  animateTurnSwitch(result, previousPlayer) {
    const game = result.game;
    const player1Id = game.players[0];
    const player2Id = game.players[1];

    // Direction is always the same for both players
    const isMovingRight = previousPlayer === player1Id && game.currentPlayer === player2Id;
    const isMovingLeft = previousPlayer === player2Id && game.currentPlayer === player1Id;

    // Map to local UI: player1 sees .nextGif2 as right, player2 sees .nextGif as right
    const isPlayer1 = this.playerId === player1Id;
    let showGif;
    if (isMovingRight) {
      showGif = isPlayer1 ? '.nextGif2' : '.nextGif';
    } else if (isMovingLeft) {
      showGif = isPlayer1 ? '.nextGif' : '.nextGif2';
    } else {
      return;
    }

    document.querySelector('.nextGif').classList.add('hidden');
    document.querySelector('.nextGif2').classList.add('hidden');
    document.querySelector(showGif).classList.remove('hidden');
    setTimeout(() => {
      document.querySelector(showGif).classList.add('hidden');
    }, 1200);
  }
  leaveGame() {
    if (this.socket) {
      this.socket.emit('leave_game');
    }
    this.returnToLobby();
  }

  returnToLobby() {
    this.gameState = null;
    this.gameId = null;
    this.isSpectating = false;

    document.querySelector('.game-panel').classList.add('hidden');
    this.enableGameControls();

    // Reset original game controls
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    rollBtn.onclick = window.rolleDice;
    holdBtn.onclick = window.holdFunction;

    this.openMultiplayerModal();
  }

  openMultiplayerModal() {
    document.querySelector('.multiplayer-modal').classList.remove('hidden');
    document.querySelector('.modal-overlay').classList.remove('hidden');
  }

  closeMultiplayerModal() {
    document.querySelector('.multiplayer-modal').classList.add('hidden');
    document.querySelector('.modal-overlay').classList.add('hidden');
  }

  closeGameRequestModal() {
    document.querySelector('.game-request-modal').classList.add('hidden');
    document.querySelector('.modal-overlay').classList.add('hidden');
    this.pendingRequestFrom = null;
  }

  // Add after chat system setup in MultiplayerClient
  setupEmojiPicker() {
    // Add emoji picker button to chat UI
    const chatForm = document.getElementById('chat-form');
    if (!chatForm) return;
    const emojiBtn = document.createElement('button');
    emojiBtn.type = 'button';
    emojiBtn.id = 'emoji-btn';
    emojiBtn.innerText = '😊';
    emojiBtn.title = 'Send Emoji Reaction';
    emojiBtn.style.marginRight = '0.5rem';
    chatForm.insertBefore(emojiBtn, chatForm.firstChild);

    // Emoji list
    const emojis = ['🎉','😂','😮','👏','😎','🔥','😡','😱','👍','👎','🐷','💯'];
    let picker;
    emojiBtn.onclick = (e) => {
      e.preventDefault();
      if (picker) {
        picker.remove(); picker = null; return;
      }
      picker = document.createElement('div');
      picker.className = 'emoji-picker';
      picker.style.position = 'absolute';
      picker.style.bottom = '3.5rem';
      picker.style.left = '0';
      picker.style.background = '#fff';
      picker.style.border = '1px solid #eee';
      picker.style.borderRadius = '0.5rem';
      picker.style.boxShadow = '0 0.5rem 1.5rem rgba(0,0,0,0.07)';
      picker.style.padding = '0.5rem 0.7rem';
      picker.style.zIndex = '2000';
      picker.innerHTML = emojis.map(e=>`<span style='font-size:2rem;cursor:pointer;margin:0 0.3rem;'>${e}</span>`).join('');
      chatForm.appendChild(picker);
      picker.onclick = (ev) => {
        if (ev.target.tagName === 'SPAN') {
          this.sendEmojiReaction(ev.target.textContent);
          picker.remove(); picker = null;
        }
      };
    };
    document.addEventListener('click', (e) => {
      if (picker && !chatForm.contains(e.target)) { picker.remove(); picker = null; }
    });
  }

  sendEmojiReaction(emoji) {
    if (this.socket && this.gameId) {
      this.socket.emit('emoji_reaction', {
        gameId: this.gameId,
        playerId: this.playerId,
        emoji
      });
    }
  }

  // Call setupEmojiPicker after chat UI is created
  createChatUI() {
    // ...existing code for chat UI...
    this.setupEmojiPicker();
  }

  displayEmojiReaction({ playerId, emoji }) {
    // Show in chat
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      const msg = document.createElement('div');
      msg.className = 'chat-message';
      msg.innerHTML = `<span style='font-size:1.7rem;'>${emoji}</span> <small style='color:#888;'>${playerId}</small>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    // Floating overlay
    const overlay = document.createElement('div');
    overlay.className = 'emoji-float';
    overlay.textContent = emoji;
    overlay.style.position = 'fixed';
    overlay.style.left = (window.innerWidth/2-30+Math.random()*60)+'px';
    overlay.style.top = (window.innerHeight/2-60+Math.random()*40)+'px';
    overlay.style.fontSize = '3rem';
    overlay.style.opacity = '1';
    overlay.style.transition = 'all 1.2s cubic-bezier(.4,2,.6,1)';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '3000';
    document.body.appendChild(overlay);
    setTimeout(()=>{ overlay.style.transform='translateY(-80px) scale(1.5)'; overlay.style.opacity='0'; }, 100);
    setTimeout(()=>{ overlay.remove(); }, 1300);
  }
}

// Initialize multiplayer client
const multiplayerClient = new MultiplayerClient();
