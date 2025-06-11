// Multiplayer functionality for Pig Game
class MultiplayerGame {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.playerName = null;
    this.gameId = null;
    this.isConnected = false;
    this.gameState = null;
    this.isSpectating = false;
    
    this.initializeUI();
  }

  initializeUI() {
    // Create multiplayer UI elements
    this.createMultiplayerModal();
    this.createGameRequestModal();
    this.createPlayersPanel();
    
    // Add multiplayer button to main game
    this.addMultiplayerButton();
  }

  createMultiplayerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal multiplayer-modal hidden';
    modal.innerHTML = `
      <button class="close-modal-btn">&times;</button>
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
          <div id="players-list"></div>
        </div>
        <div class="active-games">
          <h3>Active Games (Click to Watch)</h3>
          <div id="games-list"></div>
        </div>
      </div>
    `;
    
    document.querySelector('main').appendChild(modal);
    
    // Add event listeners
    document.getElementById('connect-btn').addEventListener('click', () => this.connectToLobby());
    modal.querySelector('.close-modal-btn').addEventListener('click', () => this.closeMultiplayerModal());
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
    
    document.getElementById('accept-request').addEventListener('click', () => this.acceptGameRequest());
    document.getElementById('decline-request').addEventListener('click', () => this.declineGameRequest());
  }

  createPlayersPanel() {
    const panel = document.createElement('div');
    panel.className = 'players-panel hidden';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>Game Info</h3>
        <button id="leave-game-btn">Leave Game</button>
      </div>
      <div class="game-players">
        <div class="player-card" id="player-1-card">
          <span class="player-name"></span>
          <span class="player-score">0</span>
          <span class="current-score">Current: 0</span>
        </div>
        <div class="player-card" id="player-2-card">
          <span class="player-name"></span>
          <span class="player-score">0</span>
          <span class="current-score">Current: 0</span>
        </div>
      </div>
      <div class="spectator-info hidden">
        <span>👁️ Watching Game</span>
      </div>
    `;
    
    document.querySelector('main').appendChild(panel);
    
    document.getElementById('leave-game-btn').addEventListener('click', () => this.leaveGame());
  }

  addMultiplayerButton() {
    const button = document.createElement('button');
    button.className = 'btn multiplayer-btn';
    button.innerHTML = '🌐 Multiplayer';
    button.style.cssText = `
      position: absolute;
      top: 4rem;
      right: 4rem;
      background-color: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(10px);
      padding: 0.7rem 2.5rem;
      border-radius: 50rem;
      box-shadow: 0 1.75rem 3.5rem rgba(0, 0, 0, 0.1);
      border: none;
      font-family: inherit;
      font-size: 1.8rem;
      text-transform: uppercase;
      cursor: pointer;
      font-weight: 400;
      transition: all 0.2s;
      color: #444;
    `;
    
    button.addEventListener('click', () => this.openMultiplayerModal());
    document.querySelector('main').appendChild(button);
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

    this.socket.on('player_switched', (game) => {
      this.updateGameState(game);
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
    playersList.innerHTML = '';
    
    players.forEach(player => {
      if (player.id !== this.playerId) {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
          <span>${player.name} (${player.id})</span>
          <button onclick="multiplayerGame.requestGame('${player.id}')">Challenge</button>
        `;
        playersList.appendChild(playerElement);
      }
    });
  }

  requestGame(targetPlayerId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_game', targetPlayerId);
    }
  }

  showGameRequest(data) {
    const modal = document.querySelector('.game-request-modal');
    const message = document.getElementById('request-message');
    
    message.textContent = `${data.fromName} (${data.from}) wants to play with you!`;
    modal.classList.remove('hidden');
    
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
    
    // Hide multiplayer modal and show game
    this.closeMultiplayerModal();
    document.querySelector('.players-panel').classList.remove('hidden');
    
    // Update UI for multiplayer
    this.updateGameUI(game);
    
    // Override game controls
    this.overrideGameControls();
  }

  startWatchingGame(game) {
    this.gameState = game;
    this.gameId = game.id;
    this.isSpectating = true;
    
    // Hide multiplayer modal and show game
    this.closeMultiplayerModal();
    document.querySelector('.players-panel').classList.remove('hidden');
    document.querySelector('.spectator-info').classList.remove('hidden');
    
    // Update UI for spectating
    this.updateGameUI(game);
    
    // Disable game controls for spectators
    this.disableGameControls();
  }

  updateGameUI(game) {
    const player1Card = document.getElementById('player-1-card');
    const player2Card = document.getElementById('player-2-card');
    
    const player1Id = game.players[0];
    const player2Id = game.players[1];
    
    player1Card.querySelector('.player-name').textContent = game.playerNames[player1Id];
    player2Card.querySelector('.player-name').textContent = game.playerNames[player2Id];
    
    player1Card.querySelector('.player-score').textContent = game.scores[player1Id];
    player2Card.querySelector('.player-score').textContent = game.scores[player2Id];
    
    player1Card.querySelector('.current-score').textContent = `Current: ${game.currentScores[player1Id]}`;
    player2Card.querySelector('.current-score').textContent = `Current: ${game.currentScores[player2Id]}`;
    
    // Highlight current player
    player1Card.classList.toggle('active-player', game.currentPlayer === player1Id);
    player2Card.classList.toggle('active-player', game.currentPlayer === player2Id);
    
    // Update main game UI
    document.getElementById('name--0').textContent = game.playerNames[player1Id];
    document.getElementById('name--1').textContent = game.playerNames[player2Id];
    document.getElementById('score--0').textContent = game.scores[player1Id];
    document.getElementById('score--1').textContent = game.scores[player2Id];
    document.getElementById('current--0').textContent = game.currentScores[player1Id];
    document.getElementById('current--1').textContent = game.currentScores[player2Id];
    
    // Update active player in main UI
    document.querySelector('.player--0').classList.toggle('player--active', game.currentPlayer === player1Id);
    document.querySelector('.player--1').classList.toggle('player--active', game.currentPlayer === player2Id);
  }

  overrideGameControls() {
    // Override roll dice button
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    
    rollBtn.onclick = () => {
      if (this.gameState && this.gameState.currentPlayer === this.playerId) {
        this.socket.emit('roll_dice', this.gameId);
      } else {
        alert("It's not your turn!");
      }
    };
    
    holdBtn.onclick = () => {
      if (this.gameState && this.gameState.currentPlayer === this.playerId) {
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

  handleDiceRoll(result) {
    // Update dice display
    const diceEl = document.querySelector('.dice');
    diceEl.src = `./img/dice-${result.dice}.png`;
    diceEl.classList.remove('hidden');
    
    // Update game state
    this.gameState = result.game;
    this.updateGameUI(result.game);
  }

  handleScoreHeld(result) {
    this.gameState = result.game;
    this.updateGameUI(result.game);
  }

  updateGameState(game) {
    this.gameState = game;
    this.updateGameUI(game);
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
    // Reset game state
    this.gameState = null;
    this.gameId = null;
    this.isSpectating = false;
    
    // Hide game panels
    document.querySelector('.players-panel').classList.add('hidden');
    document.querySelector('.spectator-info').classList.add('hidden');
    
    // Re-enable game controls
    const rollBtn = document.querySelector('.btn--roll');
    const holdBtn = document.querySelector('.btn--hold');
    rollBtn.disabled = false;
    holdBtn.disabled = false;
    rollBtn.style.opacity = '1';
    holdBtn.style.opacity = '1';
    
    // Show multiplayer modal
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
    this.pendingRequestFrom = null;
  }
}

// Initialize multiplayer game
const multiplayerGame = new MultiplayerGame();