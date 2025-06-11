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
    this.createMultiplayerModal();
    this.createGameRequestModal();
    this.createGamePanel();
    this.addMultiplayerButton();
    this.setupEventListeners();
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
    document.querySelector('.multiplayer-close').addEventListener('click', () => {
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
    
    if (!playerName) {
      alert('Please enter your name');
      return;
    }

    // Connect to server
    this.socket = io('http://localhost:3001');
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.updateConnectionStatus(true);
      
      // Join lobby
      this.socket.emit('join_lobby', {
        playerName: playerName,
        playerId: playerId || null
      });
    });

    this.socket.on('join_success', (player) => {
      this.playerId = player.id;
      this.playerName = player.name;
      
      document.getElementById('current-player-info').textContent = `${player.name} (${player.id})`;
      document.querySelector('.player-setup').classList.add('hidden');
      document.querySelector('.lobby-content').classList.remove('hidden');
    });

    this.socket.on('players_update', (players) => {
      this.updatePlayersList(players);
    });

    this.socket.on('games_update', (games) => {
      this.updateGamesList(games);
    });

    this.socket.on('game_request', (data) => {
      this.showGameRequest(data);
    });

    this.socket.on('game_declined', (data) => {
      alert(`${data.by} declined your game request`);
    });

    this.socket.on('game_started', (game) => {
      this.startMultiplayerGame(game);
    });

    this.socket.on('watching_game', (game) => {
      this.startWatchingGame(game);
    });

    this.socket.on('dice_rolled', (result) => {
      this.handleDiceRoll(result);
    });

    this.socket.on('score_held', (result) => {
      this.handleScoreHeld(result);
    });

    this.socket.on('game_ended', (data) => {
      this.handleGameEnd(data);
    });

    this.socket.on('player_left', (data) => {
      alert(`${data.player} left the game`);
      if (data.gameEnded) {
        this.returnToLobby();
      }
    });

    this.socket.on('player_disconnected', (data) => {
      alert(`${data.player} disconnected`);
      this.returnToLobby();
    });

    this.socket.on('error', (message) => {
      alert('Error: ' + message);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.updateConnectionStatus(false);
      alert('Disconnected from server');
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
          <span>${player.name} (${player.id})</span>
          <button onclick="multiplayerClient.requestGame('${player.id}')">Challenge</button>
        `;
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
        <button onclick="multiplayerClient.watchGame('${game.id}')">Watch</button>
      `;
      gamesList.appendChild(gameElement);
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
      gameStatus.textContent = game.currentPlayer === this.playerId ? 'Your turn' : 'Opponent\'s turn';
    }
  }

  updateGameUI(game) {
    // Update main game display
    const player1Id = game.players[0];
    const player2Id = game.players[1];
    
    document.getElementById('name--0').textContent = game.playerNames[player1Id];
    document.getElementById('name--1').textContent = game.playerNames[player2Id];
    document.getElementById('score--0').textContent = game.scores[player1Id];
    document.getElementById('score--1').textContent = game.scores[player2Id];
    document.getElementById('current--0').textContent = game.currentScores[player1Id];
    document.getElementById('current--1').textContent = game.currentScores[player2Id];
    
    // Update active player
    document.querySelector('.player--0').classList.toggle('player--active', game.currentPlayer === player1Id);
    document.querySelector('.player--1').classList.toggle('player--active', game.currentPlayer === player2Id);
    
    // Update game status
    if (!this.isSpectating) {
      const gameStatus = document.getElementById('game-status');
      gameStatus.textContent = game.currentPlayer === this.playerId ? 'Your turn' : 'Opponent\'s turn';
    }
  }

  overrideGameControls() {
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    
    rollBtn.onclick = () => {
      if (this.gameState && this.gameState.currentPlayer === this.playerId && this.gameState.playing) {
        this.socket.emit('roll_dice', this.gameId);
      } else {
        alert("It's not your turn!");
      }
    };
    
    holdBtn.onclick = () => {
      if (this.gameState && this.gameState.currentPlayer === this.playerId && this.gameState.playing) {
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

  handleDiceRoll(result) {
    const diceEl = document.querySelector('.dice');
    diceEl.src = `./img/dice-${result.dice}.png`;
    diceEl.classList.remove('hidden');
    
    this.gameState = result.game;
    this.updateGameUI(result.game);
  }

  handleScoreHeld(result) {
    this.gameState = result.game;
    this.updateGameUI(result.game);
  }

  handleGameEnd(data) {
    alert(`🎉 ${data.winner.name} wins the game!`);
    this.returnToLobby();
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
}

// Initialize multiplayer client
const multiplayerClient = new MultiplayerClient();