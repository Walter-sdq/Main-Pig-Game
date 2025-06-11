export class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(player1, player2) {
    const gameId = this.generateGameId();
    const game = {
      id: gameId,
      players: [player1.id, player2.id],
      playerNames: {
        [player1.id]: player1.name,
        [player2.id]: player2.name
      },
      scores: {
        [player1.id]: 0,
        [player2.id]: 0
      },
      currentScores: {
        [player1.id]: 0,
        [player2.id]: 0
      },
      currentPlayer: player1.id,
      playing: true,
      watchers: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  getAllGames() {
    return Array.from(this.games.values()).map(game => ({
      id: game.id,
      players: game.players.map(id => game.playerNames[id]),
      scores: game.scores,
      currentPlayer: game.playerNames[game.currentPlayer],
      playing: game.playing,
      watchers: game.watchers.length,
      createdAt: game.createdAt
    }));
  }

  rollDice(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.playing) return null;

    const dice = Math.floor(Math.random() * 6) + 1;
    const currentPlayerId = game.currentPlayer;
    game.lastActivity = new Date();

    if (dice === 1) {
      // Player loses current score and turn switches
      game.currentScores[currentPlayerId] = 0;
      this.switchPlayer(game);
      
      return {
        dice,
        currentScore: 0,
        switchPlayer: true,
        gameOver: false,
        game
      };
    } else {
      // Add to current score
      game.currentScores[currentPlayerId] += dice;
      
      return {
        dice,
        currentScore: game.currentScores[currentPlayerId],
        switchPlayer: false,
        gameOver: false,
        game
      };
    }
  }

  holdScore(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.playing) return null;

    const currentPlayerId = game.currentPlayer;
    game.lastActivity = new Date();
    
    // Add current score to total score
    game.scores[currentPlayerId] += game.currentScores[currentPlayerId];
    game.currentScores[currentPlayerId] = 0;

    // Check for winner
    if (game.scores[currentPlayerId] >= 100) {
      game.playing = false;
      return {
        gameOver: true,
        winner: {
          id: currentPlayerId,
          name: game.playerNames[currentPlayerId]
        },
        game
      };
    }

    // Switch player
    this.switchPlayer(game);

    return {
      gameOver: false,
      game
    };
  }

  switchPlayer(game) {
    const currentIndex = game.players.indexOf(game.currentPlayer);
    const nextIndex = (currentIndex + 1) % game.players.length;
    game.currentPlayer = game.players[nextIndex];
  }

  addWatcher(gameId, playerId) {
    const game = this.games.get(gameId);
    if (game && !game.watchers.includes(playerId)) {
      game.watchers.push(playerId);
    }
  }

  removeWatcher(gameId, playerId) {
    const game = this.games.get(gameId);
    if (game) {
      game.watchers = game.watchers.filter(id => id !== playerId);
    }
  }

  endGame(gameId) {
    this.games.delete(gameId);
  }

  generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Clean up inactive games (optional - can be called periodically)
  cleanupInactiveGames(maxInactiveMinutes = 30) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - maxInactiveMinutes * 60 * 1000);
    
    for (const [gameId, game] of this.games.entries()) {
      if (game.lastActivity < cutoff) {
        this.endGame(gameId);
        console.log(`Cleaned up inactive game: ${gameId}`);
      }
    }
  }
}