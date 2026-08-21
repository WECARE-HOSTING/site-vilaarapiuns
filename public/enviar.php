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

// ── Resposta ─────────────────────────────────────────────────────────────
$querJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function responde(bool $ok, array $erros, string $idioma, bool $json): never {
  if ($json) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($ok ? 200 : 422);
    echo json_encode(['ok' => $ok, 'erros' => $erros], JSON_UNESCAPED_UNICODE);
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
$local = in_array($host, ['localhost', '127.0.0.1'], true);
if (!$nosso && !$local) {
  http_response_code(403); exit('origem');
}

// ── 3. Honeypot ──────────────────────────────────────────────────────────
// Responde SUCESSO. Dizer "você caiu na armadilha" é ensinar o bot.
if (campo('_hp') !== '') { responde(true, [], $idioma, $querJson); }

// ── 4. Tempo mínimo ──────────────────────────────────────────────────────
// _t é preenchido por JS no CARREGAMENTO. Página estática: um timestamp
// vindo do build seria o horário do build. Vazio = sem JS, e sem JS não se
// rejeita ninguém — as outras quatro defesas seguem valendo.
$t = (int)campo('_t');
if ($t > 0 && (time() - $t) < TEMPO_MINIMO) { responde(true, [], $idioma, $querJson); }

// ── 5. Limite por IP ─────────────────────────────────────────────────────
$varDir = rtrim((string)$cfg['varDir'], '/');
if (!is_dir($varDir)) { @mkdir($varDir, 0700, true); }
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0');
$arq = $varDir . '/rate-' . hash('sha256', $ip) . '.json';
$agora = time();
$hist = is_file($arq) ? (json_decode((string)file_get_contents($arq), true) ?: []) : [];
$hist = array_values(array_filter($hist, fn($ts) => $agora - $ts < 86400));
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
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL))         { $erros['email'] = 'invalido'; }
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
$ano = campo('ano');
if ($mes !== 'flexivel' && $mes !== '' && !preg_match('/^20\d{2}$/', $ano)) {
  $erros['ano'] = 'obrigatorio';
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
