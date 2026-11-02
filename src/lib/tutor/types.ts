// Tipos do tutor de IA

// Lance encontrado num texto; start/end são posições no texto original
export interface MoveMention {
  raw: string
  start: number
  end: number
  san: string
  uci: string
}
