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
  /** Chave estável — usada como `key` de lista e como âncora de depuração. */
  id: string;
  foto: ImageMetadata;
  /** O assunto, em .etiqueta. Ex.: "O bangalô". */
  assunto: string;
  /** O material ou a medida. Fato, não elogio. */
  legenda: string;
  /** O que está na foto, para quem não a vê. Escrito olhando a foto. */
  alt: string;
}

export const ACOMODACOES: FotoAcomodacao[] = [
  {
    id: 'bangalo-palafita',
    foto: bangaloPalafita,
    assunto: 'O bangalô',
    legenda: 'Dois pavimentos, sobre palafitas',
    alt: 'Bangalô de madeira de dois pavimentos sobre palafitas, com telhado de palha, escada externa e varanda com rede, entre os troncos da mata',
  },
  {
    id: 'bangalo-octogonal',
    foto: bangaloOctogonal,
    assunto: 'O octogonal',
    legenda: 'Telhado de palha, entre as árvores',
    alt: 'Bangalô octogonal de madeira suspenso sobre pilares, com telhado cônico de palha e uma copa aberta embaixo, cercado de floresta',
  },
  {
    id: 'chale-11',
    foto: chale11,
    assunto: 'O chalé',
    legenda: 'Um pavimento, rede na varanda',
    alt: 'Fachada do chalé número 11, de um pavimento em madeira escura sobre estacas, com rede listrada armada na varanda coberta',
  },
  {
    id: 'varanda-rede',
    foto: varandaRedeDuplex,
    assunto: 'A varanda',
    legenda: 'Rede armada e cadeira de cipó',
    alt: 'Varanda do pavimento superior com rede preta armada de ponta a ponta, cadeira de cipó, mesa redonda e um prato trançado na parede de madeira',
  },
  {
    id: 'varanda-noite',
    foto: varandaNoite,
    assunto: 'A varanda à noite',
    legenda: 'Luminária de fibra trançada',
    alt: 'A mesma varanda depois do anoitecer, com rede armada e uma luminária alta de fibra trançada acesa sob o telhado de palha',
  },
  {
    id: 'quarto-casal-mogno',
    foto: gal6,
    assunto: 'O quarto de casal',
    legenda: 'Porta de mogno, medalhão octogonal',
    alt: 'Cama de casal com roupa branca e manta xadrez de chocolate e aveia dobrada ao pé, entre uma porta interna com medalhão octogonal e uma porta de mogno com marchetaria radial',
  },
  {
    id: 'quarto-casal',
    foto: quartoCasal,
    assunto: 'A cama',
    legenda: 'Manta xadrez tecida em tear',
    alt: 'Quarto de paredes de madeira escura com cama de casal, manta xadrez de chocolate e aveia dobrada ao pé, toalhas enroladas e uma cadeira de madeira junto à janela aberta',
  },
  {
    id: 'marchetaria',
    foto: quartoDuplex,
    assunto: 'A marchetaria',
    legenda: 'Cunhas radiais de veio oposto',
    alt: 'Cama de solteiro com colcha listrada vista de lado, ao lado de uma porta de mogno cujas cunhas de veio oposto irradiam de um centro octogonal, com o telhado de palha à direita',
  },
  {
    id: 'quarto-twin',
    foto: quartoTwin,
    assunto: 'O quarto twin',
    legenda: 'Duas camas, porta para a varanda',
    alt: 'Quarto com duas camas de solteiro de madeira, porta dupla aberta para a varanda onde há uma rede armada, e a mata logo atrás',
  },
  {
    id: 'banheiro-pia',
    foto: banheiroPia,
    assunto: 'O banheiro',
    legenda: 'Cuba de louça e cestaria regional',
    alt: 'Cuba branca de louça sobre bancada de madeira maciça, com torneira alta, espelho de moldura de madeira, cestos trançados e o telhado de palha visível por cima da parede',
  },
];
