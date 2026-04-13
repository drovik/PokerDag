export type Participant = {
  id: string;
  name: string;
  vote: string | null;
};

export const CARD_VALUES = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'] as const;
export type CardValue = (typeof CARD_VALUES)[number];
