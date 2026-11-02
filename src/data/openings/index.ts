import type { Opening } from './types';
import { italiana } from './lines/italiana';
import { ruyLopez } from './lines/ruy-lopez';
import { gambitoDaDama } from './lines/gambito-da-dama';
import { londres } from './lines/londres';
import { siciliana } from './lines/siciliana';
import { francesa } from './lines/francesa';
import { caroKann } from './lines/caro-kann';
import { eslava } from './lines/eslava';

/** Biblioteca de aberturas: primeiro as de brancas, depois as de pretas. */
export const OPENINGS: Opening[] = [italiana, ruyLopez, gambitoDaDama, londres, siciliana, francesa, caroKann, eslava];

export type { Opening, OpeningLine, OpeningTrap, OpeningMistake, OpeningKeyPosition, SanLine } from './types';
