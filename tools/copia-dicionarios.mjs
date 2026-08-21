/**
 * Copia os dicionários para dist/_i18n/, porque enviar.php precisa da copy
 * da auto-resposta nos cinco idiomas.
 *
 * A alternativa era escrever essa copy uma segunda vez dentro do PHP. Um
 * texto que vive em dois lugares divergentes é um texto errado esperando a
 * vez, e este em particular carrega a promessa das 24 horas.
 */
import { mkdirSync, copyFileSync } from 'node:fs';

mkdirSync('dist/_i18n', { recursive: true });
for (const l of ['pt', 'en', 'es', 'de', 'ja']) {
  copyFileSync(`src/i18n/${l}.json`, `dist/_i18n/${l}.json`);
}
console.log('dicionários copiados para dist/_i18n/');
