# Pig Game Backend

A Node.js backend server for the multiplayer Pig Game using Express and Socket.IO.

## Features

- **Real-time multiplayer gameplay** using Socket.IO
- **Unique player IDs** (4-character alphanumeric)
- **Game lobbies** where players can see online players
- **Game requests** and acceptance system
- **Spectator mode** to watch ongoing games
- **Automatic game management** and cleanup

## API Endpoints

### REST API
- `GET /api/health` - Server health check
- `GET /api/games` - Get all active games
- `GET /api/players` - Get all connected players

### Socket.IO Events

#### Client to Server
- `join_lobby` - Join the game lobby with player data
- `request_game` - Request to play with another player
- `accept_game` - Accept a game request
- `decline_game` - Decline a game request
- `watch_game` - Watch an ongoing game
- `roll_dice` - Roll dice during game
- `hold_score` - Hold current score and switch turns
- `leave_game` - Leave current game or stop watching

#### Server to Client
- `join_success` - Successful lobby join
- `players_update` - Updated list of lobby players
- `games_update` - Updated list of active games
- `game_request` - Incoming game request
- `game_declined` - Game request was declined
- `game_started` - Game has started
- `watching_game` - Started watching a game
- `dice_rolled` - Dice roll result
- `score_held` - Score was held
- `game_ended` - Game finished with winner
- `player_left` - Player left the game
- `player_disconnected` - Player disconnected
- `error` - Error message

## Game Flow

1. **Join Lobby**: Player connects and joins lobby with unique ID
2. **Find Players**: See list of available players in lobby
3. **Request Game**: Click on player to send game request
4. **Accept/Decline**: Target player can accept or decline
5. **Play Game**: Standard Pig Game rules with real-time updates
6. **Watch Games**: Spectate ongoing games if not playing
7. **Game End**: Winner declared, players return to lobby

## Player States

- `lobby` - Available for games in the lobby
- `playing` - Currently in a game
- `watching` - Spectating a game

## Installation

```bash
cd backend
npm install
```

## Running

```bash
# Development with auto-restart
npm run dev

# Production
npm start
```

The server runs on port 3001 by default.

## Game Rules

Same as the original Pig Game:
- Players take turns rolling dice
- Roll adds to current score (except rolling 1)
- Rolling 1 loses current score and switches turns
- Hold to add current score to total and switch turns
- First to 100 points wins!

## Architecture

- **PlayerManager**: Handles player connections, unique IDs, and status
- **GameManager**: Manages game creation, state, and logic
- **Socket.IO**: Real-time communication between clients and server
- **Express**: REST API for health checks and game info