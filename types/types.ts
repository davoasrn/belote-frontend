import { ReactNode } from "react";

export enum Suit {
  Clubs = 'Clubs',
  Diamonds = 'Diamonds',
  Hearts = 'Hearts',
  Spades = 'Spades',
}

export enum Rank {
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  disconnected?: boolean;
  id: string;
  name: string;
  hand: Card[];
}

export interface Bid {
  suit: Suit;
  player: Player['id'];
}

export enum GamePhase {
  Bidding = 'Bidding',
  Playing = 'Playing',
  Scoring = 'Scoring',
  Finished = 'Finished',
}

export interface GameState {
  winningTeam: ReactNode;
  gameId: string;
  players: [Player, Player, Player, Player];
  deck: Card[];
  currentTurnPlayerIndex: number;
  phase: GamePhase;
  bids: Bid[];
  trumpSuit?: Suit;
  currentTrick: { card: Card; playerId: Player['id'] }[];
  teamScores: {
    team1: number;
    team2: number;
  };
}
