/**
 * DESIGN SYSTEM — Caixinha dos Noivos
 *
 * Este arquivo é a fonte única de verdade para cores usadas em
 * inline styles e lógica JS. Para mudar o tema visual:
 *
 *   1. Troque os valores em `colors` abaixo
 *   2. Atualize os CSS vars em `src/app/globals.css` (seção DESIGN TOKENS)
 *   3. Atualize `gold` em `tailwind.config.ts` se quiser usar as classes gold-*
 *
 * Conversor hex → HSL: https://www.colorhexa.com/
 */

export const colors = {
  /** Cor principal — botões, destaques, progress bar, ranking */
  primary: "#d4a017",

  /** Cor primária mais escura — hover, sombras */
  primaryDark: "#a87c10",

  /** Cor secundária — fundos suaves, badges, seções */
  secondary: "#f4edd9",

  /** Cinza neutro para itens sem destaque (ranking, etc.) */
  muted: "hsl(44 20% 75%)",

  /** Texto sobre fundo muted */
  mutedForeground: "hsl(43 20% 48%)",

  /** Borda padrão */
  border: "hsl(44 30% 85%)",
} as const;

/** Retorna a cor primária do tema (usada em componentes com prop `primaryColor`) */
export function getPrimaryColor(): string {
  return colors.primary;
}
