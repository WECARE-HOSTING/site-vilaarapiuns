<?php
/**
 * Recebe o formulário de reserva e manda por e-mail.
 *
 * Site estático em Apache/cPanel: este arquivo é o único pedaço de servidor
 * que existe. Astro copia public/ para dist/ sem tocar, então ele sobe por
 * FTP com o resto.
 *
 * A ordem das defesas abaixo não é decorativa. As que importam mais são as
 * duas de cabeçalho — umaLinha() e semSintaxeDeCabecalho(): injeção de
 * cabeçalho é o que transforma um form-to-mail em relay de spam alheio com o
 * seu domínio na assinatura.
 *
 * Erros saem como CÓDIGO, não como texto. O texto vem do dicionário, no
 * idioma do visitante. É o que mantém este arquivo ignorante de i18n.
 */
declare(strict_types=1);

const LIMITE_HORA = 5;
const LIMITE_DIA  = 20;
const TEMPO_MINIMO = 3;

$DOMINIO = 'vilaarapiuns.com.br';

/** Slug da página de enviado por idioma — espelha SLUGS.bookSent em routes.ts. */
const ENVIADO = [
  'pt' => 'reservar/enviado', 'en' => 'book/sent', 'es' => 'reservar/enviado',
  'de' => 'buchen/gesendet',  'ja' => 'book/sent',
];

const MESES    = ['1','2','3','4','5','6','7','8','9','10','11','12','flexivel'];
const PESSOAS  = ['1','2','3-6','7-14','15-26'];
const INTERESSE = ['pousada','pacote','privativa','naosei'];

// ── Config ───────────────────────────────────────────────────────────────
$cfgPath = __DIR__ . '/../va-config.php';
if (!is_file($cfgPath)) { http_response_code(500); exit('config ausente'); }
$cfg = require $cfgPath;

// Config existir não é config servir. Um va-config.php escrito à mão sem
// `varDir` faz o PHP 8 emitir "Undefined array key" ANTES de qualquer
// cabeçalho — mesmo estrago do campo em array: o Location morre em "headers
// already sent" e o caminho do servidor aparece na tela. Pior: $varDir vira
// '', o contador de limite tenta gravar na raiz do filesystem, falha em
// silêncio e o limite por IP nunca mais engata — o formulário fica aberto
// sem que nada apareça quebrado. Falha FECHADA, com a mesma mensagem pelada
// da config ausente: quem pediu não descobre o que faltou.
if (!is_array($cfg)) { http_response_code(500); exit('config ausente'); }
foreach (['varDir', 'to', 'bcc'] as $chaveObrigatoria) {
  $v = $cfg[$chaveObrigatoria] ?? null;
  if (!is_string($v) || trim($v) === '') { http_response_code(500); exit('config ausente'); }
}
// `dryRun` é bool, e `false` é valor LEGÍTIMO — por isso não cabe no laço
// acima: is_string()/trim() rejeitaria `false` como se a chave estivesse
// ausente. Sem esta checagem em separado, um va-config.php escrito à mão sem
// `dryRun` faz o PHP 8 avisar "Undefined array key" bem no `if` de
// enviar-mail.php (mesmo estrago de cabeçalho do comentário acima) — e pior:
// chave ausente lida com `??`/`if` direto é FALSA por padrão, então o
// formulário entraria no ramo de SMTP DE VERDADE num config que o operador
// acredita estar em dryRun. Falha fechada, mesma mensagem pelada.
if (!array_key_exists('dryRun', $cfg) || !is_bool($cfg['dryRun'])) {
  http_response_code(500); exit('config ausente');
}

// ── Resposta ─────────────────────────────────────────────────────────────
$querJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function responde(bool $ok, array $erros, string $idioma, bool $json): never {
  if ($json) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($ok ? 200 : 422);
    // (object): array PHP vazio serializa como `[]` e array com chaves como
    // `{...}`, então `erros` mudava de TIPO entre sucesso e falha. O JS do
    // formulário lê `erros[campo]` — forçar objeto sempre poupa quem consome
    // de tratar duas formas para o mesmo campo.
    echo json_encode(['ok' => $ok, 'erros' => (object)$erros], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $idioma = isset(ENVIADO[$idioma]) ? $idioma : 'en';
  if ($ok) {
    header('Location: /' . $idioma . '/' . ENVIADO[$idioma] . '/', true, 303);
  } else {
    header('Location: /' . $idioma . '/?erro=1', true, 303);
  }
  exit;
}

/** Tira CR e LF: sem isso qualquer campo abre uma LINHA de cabeçalho nova. */
function umaLinha(string $s): string {
  return trim(str_replace(["\r", "\n", "\0"], '', $s));
}

/**
 * Tira o que só tem sentido na SINTAXE de um cabeçalho de e-mail.
 *
 * Tirar CR/LF impede criar uma LINHA de cabeçalho nova. Não impede plantar
 * um cabeçalho DENTRO de uma linha que já existe: `Ana\r\nBcc: invasor@x`
 * vira `AnaBcc: invasor@x` e ia inteiro para o Reply-To e para o Subject,
 * com endereço alheio e tudo. Um "Bcc:" grudado no nome de exibição já é
 * cabeçalho malformado, e cada MTA no caminho remenda malformado do seu
 * jeito — é aí que nasce o relay.
 *
 * Nome de pessoa não tem arroba nem dois pontos. Quem manda isso no campo
 * "nome" não está se apresentando.
 */
function semSintaxeDeCabecalho(string $s): string {
  return trim(str_replace(
    ['(', ')', '<', '>', '[', ']', ':', ';', '@', ',', '"', '\\'], '', $s
  ));
}

/**
 * Endereço que pode entrar num cabeçalho — mais estrito que a RFC de propósito.
 *
 * FILTER_VALIDATE_EMAIL aceita local part entre aspas, e está certo: pela RFC
 * `"a>,invasor@evil.com,b<c"@example.com` é um endereço válido. Só que esse
 * endereço vai para dentro de `Reply-To: Nome <...>`, e cliente de e-mail que
 * não honra aspas dentro de angle-addr — leitura leniente é a regra, não a
 * exceção — enxerga ali um SEGUNDO endereço entregável: invasor@evil.com.
 *
 * Não é relay de spam (CR/LF já não passam por umaLinha). É pior de outro
 * jeito: qualquer visitante anônimo planta um endereço no Reply-To da
 * pousada, e a primeira resposta da equipe manda os dados do hóspede para o
 * invasor. Local part entre aspas é raríssimo fora de RFC — nenhum hóspede de
 * verdade esbarra nisto; o Reply-To plantado é buraco de verdade.
 */
function emailDeCabecalho(string $s): bool {
  return filter_var($s, FILTER_VALIDATE_EMAIL) !== false
      && !preg_match('/["\s<>,;:\\\\()\[\]]/', $s);
}

/**
 * Chave do contador de limite. IPv4: o endereço. IPv6: o /64.
 *
 * Provedor de IPv6 entrega /64 até para VPS de dez dólares — 2^64 endereços
 * para o mesmo dono. Contar por endereço exato daria a esse dono 2^64 cotas
 * de 5/hora (o limite deixa de existir) e criaria um arquivo por endereço,
 * sem teto: cota de inodes estourada no cPanel derruba muito mais que o
 * formulário.
 *
 * `strlen($bin) === 16` testa a FAMÍLIA DA STRING, não a família real do
 * cliente. Um Apache dual-stack apresenta todo visitante IPv4 como
 * IPv4-mapped (`::ffff:a.b.c.d`) — 16 bytes, então cai no ramo do /64 — e os
 * 96 bits que precedem o IPv4 embutido são IDÊNTICOS em todo endereço
 * mapeado (80 zeros + 16 uns). Sem desembrulhar primeiro, TODA visita IPv4
 * do planeta cai no mesmo balde "0000000000000000::/64", o limite de 5/hora
 * passa a valer para a humanidade inteira, e a sexta pergunta de QUALQUER UM
 * na mesma hora devolve 429 para todo mundo — o canal de contato da pousada
 * fecha sozinho, com a cara de que ninguém está escrevendo.
 */
function chaveDeLimite(string $ip): string {
  $bin = @inet_pton($ip);
  if ($bin === false) { return $ip; }
  // IPv4-mapped (::ffff:0:0/96): desembrulha para o IPv4 real ANTES de
  // decidir o balde, para que ele caia no MESMO balde que esse IPv4
  // chegando puro (sem o involucro IPv6) cairia.
  if (strlen($bin) === 16 && str_starts_with($bin, "\0\0\0\0\0\0\0\0\0\0\xff\xff")) {
    return (string)inet_ntop(substr($bin, 12, 4));
  }
  if (strlen($bin) === 16) { return bin2hex(substr($bin, 0, 8)) . '::/64'; }
  return $ip;
}

/**
 * Deixa rastro dos descartes silenciosos (honeypot e tempo mínimo).
 *
 * Esses dois caminhos devolvem sucesso FALSO de propósito: dizer "você caiu
 * na armadilha" é ensinar o bot. O preço é que um pedido de gente de verdade
 * descartado por engano — autofill de navegador às vezes preenche honeypot,
 * relógio de aparelho às vezes mente — some sem deixar nada, e o negócio
 * perde a reserva sem ter como desconfiar. Esta linha é a única forma de
 * saber. A RESPOSTA não muda: o bot continua sem aprender nada.
 *
 * Os dois pontos de chamada ficam ANTES do limite por IP (a defesa 5 só vê
 * pedido aceito por completo — o contador só cresce lá na frente, depois da
 * validação). Isso quer dizer que nada aqui limita quantas vezes um mesmo
 * anônimo aciona este log: `curl -d '_hp=x'` em loop, sem credencial nenhuma,
 * apenda para sempre. Sem teto, cota de disco/inode de plano compartilhado
 * cheia derruba e-mail e site juntos — não só o formulário — e o LOCK_EX
 * ainda serializa cada escrita, então a mesma inundação passa a prender os
 * processos PHP em flock: negação de serviço mais barata para o atacante do
 * que a que existia antes deste log. O teto abaixo faz o pedido nº um-milhão
 * custar um filesize() (sem lock) em vez de outra escrita travada.
 */
/**
 * Apenda uma linha a um arquivo de log, com teto de 1 MB — a MESMA regra
 * para todo log deste formulário (hoje descartes.log aqui e erros.log em
 * enviar-mail.php). Escrita uma vez só: um teto que existisse em duas cópias
 * é um teto que um dia diverge (uma cópia ganha o ajuste, a outra não).
 */
function apendaComTeto(string $arq, string $linha): void {
  // @filesize: arquivo ainda não existir não pode virar aviso do PHP.
  if (is_file($arq) && (@filesize($arq) ?: 0) >= 1_000_000) { return; }
  // @ e sem checar retorno: log é diagnóstico, não pode derrubar o pedido nem
  // imprimir caminho de servidor na tela de quem está sem JS.
  @file_put_contents($arq, $linha, FILE_APPEND | LOCK_EX);
}

function registraDescarte(string $varDir, string $motivo): void {
  if ($varDir === '') { return; }
  apendaComTeto($varDir . '/descartes.log', gmdate('c') . "\t" . $motivo . "\n");
}

function campo(string $nome): string {
  $valor = $_POST[$nome] ?? '';
  // `nome[]=x` chega como array. O cast direto emitiria "Array to string
  // conversion" ANTES de qualquer cabeçalho: o Location morre com "headers
  // already sent" e, com display_errors ligado, o caminho do servidor
  // aparece na tela do visitante. Campo que não é texto não é campo.
  if (!is_string($valor)) { return ''; }
  return umaLinha(mb_substr($valor, 0, 3000));
}

// ── 1. Só POST ───────────────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405); header('Allow: POST'); exit('só POST');
}

$idioma = in_array($_POST['idioma'] ?? '', array_keys(ENVIADO), true) ? $_POST['idioma'] : 'en';

// ── 2. Mesma origem ──────────────────────────────────────────────────────
// Compara o HOST, não a string inteira: `str_contains` daria passe livre a
// https://vilaarapiuns.com.br.dominio-do-invasor.com, que contém o nosso
// domínio e não é nosso.
$origem = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
$host = strtolower((string)(parse_url($origem, PHP_URL_HOST) ?: ''));
$nosso = $host === $DOMINIO || str_ends_with($host, '.' . $DOMINIO);
// A tolerância a localhost existe para o servidor embutido do PHP e para a
// suíte. Em produção ela não pode valer: um Referer forjado apontando para
// localhost é trivial, e sem esta trava seria um bypass da origem escrito no
// código de propósito. Só abre com dryRun ligado ou com a requisição vindo da
// própria máquina.
$daMaquina = in_array((string)($_SERVER['REMOTE_ADDR'] ?? ''), ['127.0.0.1', '::1'], true);
$local = (!empty($cfg['dryRun']) || $daMaquina)
      && in_array($host, ['localhost', '127.0.0.1', '[::1]'], true);
if (!$nosso && !$local) {
  http_response_code(403); exit('origem');
}

// varDir sobe para cá porque o log de descartes (defesas 3 e 4) precisa dele
// antes do limite por IP.
$varDir = rtrim((string)$cfg['varDir'], '/');
if (!is_dir($varDir)) { @mkdir($varDir, 0700, true); }

// ── 3. Honeypot ──────────────────────────────────────────────────────────
// Responde SUCESSO. Dizer "você caiu na armadilha" é ensinar o bot.
if (campo('_hp') !== '') {
  registraDescarte($varDir, 'honeypot');
  responde(true, [], $idioma, $querJson);
}

// ── 4. Tempo mínimo ──────────────────────────────────────────────────────
// _t é preenchido por JS no CARREGAMENTO. Página estática: um timestamp
// vindo do build seria o horário do build. Vazio = sem JS, e sem JS não se
// rejeita ninguém — as outras quatro defesas seguem valendo.
$t = (int)campo('_t');
$decorrido = time() - $t;
// $decorrido >= 0: _t vem do RELÓGIO DO APARELHO do visitante, não do nosso.
// Um celular cinco minutos adiantado produz decorrido negativo, e negativo é
// "menor que o mínimo" — sem esta guarda, TODO pedido daquele visitante seria
// descartado em silêncio enquanto ele vê a página de confirmação. Relógio
// adiantado é timestamp sem serventia, e sem timestamp não se rejeita
// ninguém: mesma regra do _t ausente.
if ($t > 0 && $decorrido >= 0 && $decorrido < TEMPO_MINIMO) {
  registraDescarte($varDir, 'tempo-minimo');
  responde(true, [], $idioma, $querJson);
}

// ── 5. Limite por IP ─────────────────────────────────────────────────────
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0');
$arq = $varDir . '/rate-' . hash('sha256', chaveDeLimite($ip)) . '.json';
$agora = time();
// @ e retorno checado: um varDir ilegível não pode virar aviso do PHP na
// tela (o Location morreria em "headers already sent") nem alimentar
// json_decode com um `false` castado para string.
$bruto = is_file($arq) ? @file_get_contents($arq) : false;
$hist = is_string($bruto) ? (json_decode($bruto, true) ?: []) : [];
if (!is_array($hist)) { $hist = []; }
$hist = array_values(array_filter($hist, fn($ts) => $agora - $ts < 86400));
// Histórico vazio é arquivo que ninguém mais lê. Sem apagar, cada endereço
// que passou uma vez pelo site deixa um arquivo para sempre — e "para
// sempre" num plano de hospedagem compartilhada é a cota de inodes.
if (!$hist && is_file($arq)) { @unlink($arq); }
$naHora = count(array_filter($hist, fn($ts) => $agora - $ts < 3600));
if ($naHora >= LIMITE_HORA || count($hist) >= LIMITE_DIA) {
  http_response_code(429); exit('limite');
}

// ── 6/7. Validação, lista branca, sanitização ────────────────────────────
$erros = [];

$nome = semSintaxeDeCabecalho(campo('nome'));
if ($nome === '')                { $erros['nome'] = 'obrigatorio'; }
elseif (mb_strlen($nome) < 2)    { $erros['nome'] = 'invalido'; }
elseif (mb_strlen($nome) > 80)   { $erros['nome'] = 'longo'; }

$email = campo('email');
if ($email === '')                                          { $erros['email'] = 'obrigatorio'; }
elseif (!emailDeCabecalho($email))                          { $erros['email'] = 'invalido'; }
elseif (mb_strlen($email) > 120)                            { $erros['email'] = 'longo'; }

$whatsapp = campo('whatsapp');
if ($whatsapp !== '' && !preg_match('/^[0-9+\s()\-]{8,20}$/', $whatsapp)) {
  $erros['whatsapp'] = 'invalido';
}

$mes = campo('mes');
if ($mes === '')                              { $erros['mes'] = 'obrigatorio'; }
elseif (!in_array($mes, MESES, true))         { $erros['mes'] = 'opcao'; }

// Ano só importa se o mês for concreto. Sem JS os dois selects aparecem,
// então o valor vem e é ignorado — não é erro do visitante.
//
// Ausente e malformado são erros DIFERENTES. Antes, `1999` e `abcd` caíam em
// 'obrigatorio' e o formulário dizia "campo obrigatório" em cima de um campo
// visivelmente preenchido — quem lê isso não tem ideia do que corrigir.
$ano = campo('ano');
if ($mes !== 'flexivel' && $mes !== '') {
  if ($ano === '')                          { $erros['ano'] = 'obrigatorio'; }
  elseif (!preg_match('/^20\d{2}$/', $ano)) { $erros['ano'] = 'invalido'; }
}

$pessoas = campo('pessoas');
if ($pessoas === '')                            { $erros['pessoas'] = 'obrigatorio'; }
elseif (!in_array($pessoas, PESSOAS, true))     { $erros['pessoas'] = 'opcao'; }

$interesse = campo('interesse');
if ($interesse !== '' && !in_array($interesse, INTERESSE, true)) {
  $erros['interesse'] = 'opcao';
}

// A mensagem é o único campo em que quebra de linha é conteúdo, não ataque.
// Ela vai no CORPO, nunca num cabeçalho.
$msgBruta = $_POST['mensagem'] ?? '';
$mensagem = trim(str_replace("\0", '', is_string($msgBruta) ? $msgBruta : ''));
if (mb_strlen($mensagem) > 2000) { $erros['mensagem'] = 'longo'; }

if ($erros) { responde(false, $erros, $idioma, $querJson); }

// ── 8. Montar (envio entra na Tarefa 6) ──────────────────────────────────
$IDIOMA_NOME = ['pt'=>'Português','en'=>'English','es'=>'Español','de'=>'Deutsch','ja'=>'日本語'];
$MES_PT = [1=>'janeiro','fevereiro','março','abril','maio','junho','julho',
           'agosto','setembro','outubro','novembro','dezembro'];
$INTERESSE_PT = ['pousada'=>'Pousada (só estadia)','pacote'=>'Pacote saindo de Alter do Chão',
                 'privativa'=>'Grupo privativo','naosei'=>'Ainda não sabe'];

$quando = $mes === 'flexivel' ? 'ainda flexível' : ($MES_PT[(int)$mes] . '/' . $ano);
$assunto = sprintf('[Villa Arapiuns] %s — %s pessoas — %s', $nome, $pessoas, $quando);

$corpo = "Pedido pelo formulário do site.\n\n";
if ($idioma !== 'pt') {
  $corpo .= ">>> Este visitante escreveu em {$IDIOMA_NOME[$idioma]}. Responda nesse idioma. <<<\n\n";
}
$corpo .= "Nome:       {$nome}\n";
$corpo .= "E-mail:     {$email}\n";
$corpo .= 'WhatsApp:   ' . ($whatsapp !== '' ? $whatsapp : '(não informou)') . "\n";
$corpo .= "Quando:     {$quando}\n";
$corpo .= "Pessoas:    {$pessoas}\n";
$corpo .= 'Interesse:  ' . ($interesse !== '' ? $INTERESSE_PT[$interesse] : '(não informou)') . "\n";
$corpo .= 'Idioma:     ' . $IDIOMA_NOME[$idioma] . "\n\n";
$corpo .= "Mensagem (no idioma original, sem tradução):\n";
$corpo .= ($mensagem !== '' ? $mensagem : '(não escreveu nada)') . "\n\n";
$corpo .= '— ' . (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('d/m/Y H:i') . " (Brasília)\n";
$corpo .= "Responder neste e-mail vai direto para o visitante.\n";

// Registrar o envio no contador ANTES de enviar: se o SMTP falhar e alguém
// insistir, o limite ainda tem de valer.
$hist[] = $agora;
@file_put_contents($arq, json_encode($hist), LOCK_EX);

require __DIR__ . '/enviar-mail.php';   // criado na Tarefa 6
responde(true, [], $idioma, $querJson);
