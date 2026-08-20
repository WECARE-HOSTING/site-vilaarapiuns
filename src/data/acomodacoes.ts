/**
 * AS ACOMODAÇÕES — a lista única de fotos de onde o hóspede dorme.
 *
 * Existe porque a home e a página da pousada mostram a MESMA seleção, e uma
 * lista duplicada em dois arquivos é uma lista que sai de sincronia na primeira
 * troca de foto.
 *
 * MOTIVO DESTE ARQUIVO (20/08/2026). A seção "A casa" da home ilustrava o
 * parágrafo sobre marchetaria de mogno com `gal5.jpg` — que é um hóspede numa
 * canoa em campo de vitórias-régias — e legendava a foto como "Bangalô · porta
 * de mogno, marchetaria radial". A mesma foto, com a mesma legenda errada,
 * estava em "A madeira, de perto" na página da pousada. O cliente viu e pediu
 * para trocar: no lugar de uma foto, um carrossel só de acomodação.
 *
 * REGRA DE ADMISSÃO: entra só o que é a unidade do hóspede — a fachada dela, a
 * varanda dela, o quarto, o banheiro privativo. Refeitório, deck de yoga, roda
 * de fogo e praia NÃO entram: são áreas comuns, e o cliente pediu "somente das
 * acomodações". Foto de igarapé ou de canoa muito menos.
 *
 * Todas as dez são 2400×1600 (3:2) de origem, e o quadro do carrossel é 3:2 —
 * então nenhuma é recortada. Foi por isso que `banheiro-box.jpg`, a única
 * retrato do acervo de acomodação, ficou de fora: num quadro 3:2 ela perderia
 * o pé do box e o teto de palha, que é justamente o que ela tem de bom.
 *
 * `legenda` é Disciplina 2: material ou medida real, nunca adjetivo. Onde não há
 * fato confirmado por foto, `SITE` ou PRODUCT.md, a legenda descreve o que se vê
 * e para aí.
 *
 * A ORDEM é a da chegada à unidade: o volume por fora, a varanda, o quarto, o
 * detalhe da madeira, o banheiro. Não é ordem de beleza — é a ordem em que a
 * pessoa entra.
 *
 * NENHUMA foto com mosquiteiro armado entra aqui, pela mesma razão registrada
 * em Pousada.astro: mosquiteiro ao lado de "praticamente sem mosquito" é uma
 * contradição que o visitante vê antes de ler.
 */
import type { ImageMetadata } from 'astro';

import bangaloPalafita from '@/assets/imgs/bangalo-palafita.jpg';
import bangaloOctogonal from '@/assets/imgs/bangalo-octogonal.jpg';
import chale11 from '@/assets/imgs/chale-11.jpg';
import varandaRedeDuplex from '@/assets/imgs/varanda-rede-duplex.jpg';
import varandaNoite from '@/assets/imgs/varanda-noite.jpg';
import gal6 from '@/assets/imgs/gal6.jpg';
import quartoCasal from '@/assets/imgs/quarto-casal.jpg';
import quartoDuplex from '@/assets/imgs/quarto-duplex.jpg';
import quartoTwin from '@/assets/imgs/quarto-twin.jpg';
import banheiroPia from '@/assets/imgs/banheiro-pia.jpg';

export interface FotoAcomodacao {
  /** Chave estável — usada como `key` de lista, como âncora de depuração e
   *  para casar com o texto traduzido em `acomodacoes.itens` (src/i18n/*.json). */
  id: string;
  foto: ImageMetadata;
}

/** Assunto, legenda e alt de cada foto vêm do dicionário (`acomodacoes.itens`
 *  em cada `src/i18n/*.json`), casados por `id` — ver `folhaAcomodacaoTextos`
 *  em `@/i18n/utils`. Aqui fica só a foto, que não se traduz. */
export const ACOMODACOES: FotoAcomodacao[] = [
  { id: 'bangalo-palafita', foto: bangaloPalafita },
  { id: 'bangalo-octogonal', foto: bangaloOctogonal },
  { id: 'chale-11', foto: chale11 },
  { id: 'varanda-rede', foto: varandaRedeDuplex },
  { id: 'varanda-noite', foto: varandaNoite },
  { id: 'quarto-casal-mogno', foto: gal6 },
  { id: 'quarto-casal', foto: quartoCasal },
  { id: 'marchetaria', foto: quartoDuplex },
  { id: 'quarto-twin', foto: quartoTwin },
  { id: 'banheiro-pia', foto: banheiroPia },
];
