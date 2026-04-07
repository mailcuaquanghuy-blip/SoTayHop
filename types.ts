export interface Player {
  id: string;
  name: string;
  totalScore: number;
  history: number[]; // Scores for each round
}

export interface GameState {
  id?: string; // Unique identifier for the game
  players: Player[];
  rounds: number; // Count of rounds played
  gameName: string;
  isActive: boolean; // True if game is in progress, false if finished
  date?: string; // ISO Date string for history
  roundDates?: string[]; // ISO Date strings for each round
}

export interface RoundScores {
  [playerId: string]: number;
}