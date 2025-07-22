export enum Suit {
  Clubs = 'Clubs',
  Diamonds = 'Diamonds',
  Hearts = 'Hearts',
  Spades = 'Spades',
}

export type TrumpSuit = Suit | 'No-Trump';

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

/**
 * Represents user-selectable preferences for customizing the game's appearance.
 */
export interface PlayerPreferences {
  cardBack?: string;
  tableTheme?: string;
}

export enum CombinationType {
  Terz = 'Terz',
  Fifty = 'Fifty',
  Hundred = 'Hundred',
  FourOfAKind = 'FourOfAKind',
  BeloteRebelote = 'BeloteRebelote',
}

export interface Combination {
  type: CombinationType;
  cards: Card[];
  points: number;
  player: Player['id'];
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isBot?: boolean;
  disconnected?: boolean;
  declaredCombinations?: Combination[];
  preferences?: PlayerPreferences; // For future customization features
}

export interface ContractBid {
  type: 'bid';
  player: Player['id'];
  suit: TrumpSuit;
  points: number;
}

export interface Pass {
  type: 'pass';
  player: Player['id'];
}

export type BidAction = ContractBid | Pass;

export enum GamePhase {
  Bidding = 'Bidding',
  CombinationDeclaration = 'CombinationDeclaration',
  Playing = 'Playing',
  Scoring = 'Scoring',
  Finished = 'Finished',
}

export interface GameState {
  gameId: string;
  players: [Player, Player, Player, Player];
  deck: Card[];
  dealerIndex: number;
  currentTurnPlayerIndex: number;
  phase: GamePhase;
  bidHistory: BidAction[];
  winningBid?: ContractBid;
  trumpSuit?: TrumpSuit;
  currentTrick: { card: Card; playerId: string }[];
  teamScores: {
    team1: number;
    team2: number;
  };
  roundPoints: {
    team1: number;
    team2: number;
  };
  gameOver: boolean;
  winningTeam?: 'Team 1' | 'Team 2';
}
