export class PlayerManager {
  constructor() {
    this.players = new Map(); // socketId -> player
    this.playerIds = new Map(); // playerId -> socketId
  }

  addPlayer(socketId, playerId, playerName, avatar = null) {
    // Generate unique player ID if not provided or already exists
    let finalPlayerId = playerId;
    if (!finalPlayerId || this.playerIds.has(finalPlayerId)) {
      finalPlayerId = this.generateUniquePlayerId();
    }

    // Generate unique player name if not provided
    let finalPlayerName = playerName;
    if (!finalPlayerName) {
      finalPlayerName = this.generatePlayerName();
    }

    const player = {
      id: finalPlayerId,
      name: finalPlayerName,
      socketId,
      status: 'lobby', // lobby, playing, watching
      gameId: null,
      joinedAt: new Date(),
      avatar: avatar || null, // avatar support
      wins: 0, // leaderboard support
      losses: 0
    };

    this.players.set(socketId, player);
    this.playerIds.set(finalPlayerId, socketId);

    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getPlayerById(playerId) {
    const socketId = this.playerIds.get(playerId);
    return socketId ? this.players.get(socketId) : null;
  }

  getSocketId(playerId) {
    return this.playerIds.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getLobbyPlayers() {
    return Array.from(this.players.values()).filter(player => player.status === 'lobby');
  }

  updatePlayerStatus(playerId, status, gameId = null) {
    const socketId = this.playerIds.get(playerId);
    const player = this.players.get(socketId);
    if (player) {
      player.status = status;
      player.gameId = gameId;
    }
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.playerIds.delete(player.id);
      this.players.delete(socketId);
    }
  }

  incrementWins(playerId) {
    const player = this.getPlayerById(playerId);
    if (player) player.wins = (player.wins || 0) + 1;
  }

  incrementLosses(playerId) {
    const player = this.getPlayerById(playerId);
    if (player) player.losses = (player.losses || 0) + 1;
  }

  getLeaderboard(limit = 10) {
    return Array.from(this.players.values())
      .filter(p => p.wins > 0 || p.losses > 0)
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
      .slice(0, limit)
      .map(({ id, name, avatar, wins, losses }) => ({ id, name, avatar, wins, losses }));
  }

  generateUniquePlayerId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result;
    do {
      result = '';
      for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (this.playerIds.has(result));
    
    return result;
  }

  generatePlayerName() {
    const adjectives = ['Swift', 'Brave', 'Clever', 'Lucky', 'Bold', 'Quick', 'Smart', 'Cool', 'Wild', 'Epic'];
    const nouns = ['Pig', 'Dice', 'Player', 'Gamer', 'Winner', 'Champion', 'Master', 'Hero', 'Star', 'Ace'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    
    return `${adjective}${noun}${number}`;
  }
}