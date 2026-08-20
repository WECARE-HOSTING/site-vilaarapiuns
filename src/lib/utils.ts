/**
 * `cn` — junta classes e resolve conflitos de utilitário Tailwind.
 *
 * Existe porque os componentes vindos do 21st.dev esperam `@/lib/utils`, e o
 * `registryDependencies` daquele registro vem vazio: o arquivo é nosso.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
