<?php
/**
 * Entrega: e-mail para quem vende + auto-resposta para o visitante.
 *
 * Isolado do enviar.php porque validação se testa sem credencial e entrega
 * não. Em dryRun grava os dois em arquivo — é assim que se testa local, e é
 * assim que se vê exatamente o que chega na caixa de entrada.
 *
 * Do escopo do enviar.php: $cfg, $assunto, $corpo, $nome, $email, $idioma.
 *
 * Este arquivo fica em dist/, então é alcançável direto em /enviar-mail.php.
 * Chamado assim, roda com variável nenhuma definida e vaza caminho de
 * servidor no aviso do PHP. A guarda abaixo fecha essa porta.
 */
if (!isset($cfg, $assunto, $corpo, $nome, $email, $idioma)) {
  http_response_code(404);
  exit;
}

/**
 * Decodifica um dicionário de _i18n/ uma vez só por idioma tentado.
 *
 * textoAuto() é chamada duas vezes por submissão (uma para 'assunto', outra
 * para 'corpo'), e as duas tentam os MESMOS idiomas na MESMA ordem — sem
 * este cache, cada submissão lia e fazia json_decode do mesmo arquivo duas
 * vezes. `static` porque o cache só precisa viver pela duração de UMA
 * requisição PHP-FPM; não há processo de longa duração aqui para o cache
 * envelhecer.
 */
function dicionario(string $tentativa): ?array {
  static $cache = [];
  if (array_key_exists($tentativa, $cache)) { return $cache[$tentativa]; }
  $arq = __DIR__ . "/_i18n/{$tentativa}.json";
  $d = is_file($arq) ? json_decode((string)file_get_contents($arq), true) : null;
  return $cache[$tentativa] = (is_array($d) ? $d : null);
}

/**
 * Como textoAuto() (abaixo), mas também devolve DE QUAL IDIOMA o valor
 * veio — '' se nenhuma tentativa serviu. Só usado para 'corpo': é dele que
 * depende decidir, mais abaixo, se a auto-resposta saiu no idioma do
 * visitante, saiu em inglês por fallback, ou não saiu — os dois últimos
 * casos são o que o log logo depois existe para pegar.
 */
function textoAutoComOrigem(string $idioma, string $chave, array $trocas): array {
  foreach ([$idioma, 'en'] as $tentativa) {
    $d = dicionario($tentativa);
    $v = $d['autoresp'][$chave] ?? null;
    if (is_string($v) && $v !== '') return [strtr($v, $trocas), $tentativa];
  }
  return ['', ''];
}

/** Lê uma chave dos dicionários copiados pelo build. Sem i18n no PHP. */
function textoAuto(string $idioma, string $chave, array $trocas): string {
  return textoAutoComOrigem($idioma, $chave, $trocas)[0];
}

$trocas = [
  // Único dado do visitante que entra: o nome, já sem CR/LF pelo umaLinha().
  '{nome}' => $nome,
  // Número canônico em src/data/site.ts (SITE.contact.whatsapp). Duplicado
  // aqui de propósito — mover para o dicionário criaria CINCO cópias em vez
  // de uma — mas `tools/contato-unico.mjs` agora lê o PHP construído e falha
  // o build se este link se afastar do número canônico (achado I5 do review
  // da Tarefa 6).
  '{whatsapp}' => 'https://wa.me/5547992067078',
];
$autoAssunto = textoAuto($idioma, 'assunto', []);
[$autoCorpo, $origemCorpo] = textoAutoComOrigem($idioma, 'corpo', $trocas);

// Dicionário ausente, ilegível, malformado ou sem a chave é hoje uma falha
// SILENCIOSA em dois graus, e os dois precisam de rastro:
//
//   1. de.json falha, en.json cobre: a auto-resposta ainda SAI, mas no
//      idioma errado para quem escreveu em alemão — degradação silenciosa
//      do que foi prometido ("respondemos... no idioma em que você
//      escreveu"), e é exatamente o cenário de um FTP que sobe dist/_i18n/
//      pela metade.
//   2. de.json E en.json falham: textoAuto() devolve '', a auto-resposta
//      NÃO é enviada (nem gravada — ver ajuste abaixo), e sem este log nada
//      mais acontece: nem 500, nem contador. O visitante vê sucesso e
//      ninguém aprende que as auto-respostas pararam.
//
// Uma falha de SMTP já deixa rastro em erros.log; esta é a mesma classe de
// falha (entrega que não saiu como devia) e tem de deixar rastro igual —
// antes de decidir dryRun ou envio real, para valer nos dois.
if ($origemCorpo === '') {
  // Quando o idioma pedido já É 'en', as duas tentativas ([$idioma, 'en'])
  // leem o MESMO arquivo — nomear "_i18n/en.json (e o de reserva, en.json)"
  // citaria o mesmo arquivo duas vezes como se fossem dois. Só descreve o
  // idioma de reserva quando ele é de fato outro arquivo.
  $arquivosTentados = $idioma === 'en'
    ? "_i18n/en.json"
    : "_i18n/{$idioma}.json (e o de reserva, _i18n/en.json)";
  apendaComTeto($cfg['varDir'] . '/erros.log',
    date('c') . " auto-resposta vazia — idioma={$idioma}: dicionário {$arquivosTentados} ausente, ilegível, malformado ou sem a chave 'autoresp.corpo'\n");
} elseif ($origemCorpo !== $idioma) {
  apendaComTeto($cfg['varDir'] . '/erros.log',
    date('c') . " auto-resposta em idioma de reserva ({$origemCorpo}) — idioma={$idioma}: dicionário _i18n/{$idioma}.json ausente, ilegível, malformado ou sem a chave 'autoresp.corpo'\n");
}

if ($cfg['dryRun']) {
  $destino = $cfg['varDir'] . '/enviados';
  if (!is_dir($destino)) { @mkdir($destino, 0700, true); }
  $stamp = date('Ymd-His') . '-' . substr(hash('sha256', $email . microtime()), 0, 6);

  // O e-mail de venda é a ENTREGA que importa — em dryRun, o arquivo É o
  // e-mail. @ e retorno checado pelo mesmo motivo do stub que este arquivo
  // substitui: varDir sem permissão de escrita não pode emitir aviso do PHP
  // com caminho ABSOLUTO do servidor (o responde() do enviar.php morreria
  // depois em "headers already sent"), e falha engolida aqui não pode
  // passar por sucesso. 500 pelado, igual ao envio real.
  $entregou = @file_put_contents("{$destino}/{$stamp}-gabriela.txt",
    "To: {$cfg['to']}\nBcc: {$cfg['bcc']}\nReply-To: {$nome} <{$email}>\nSubject: {$assunto}\n\n{$corpo}");
  if ($entregou === false) { http_response_code(500); exit('entrega'); }

  // Auto-resposta é cortesia, mesma regra do envio real (abaixo): falhar
  // aqui não derruba a submissão. @ evita aviso do PHP; sem checar retorno,
  // de propósito — o pedido já está "entregue" na linha acima.
  //
  // Espelha a produção: corpo vazio (dicionário ausente/malformado) não
  // grava arquivo, do mesmo jeito que a produção não manda e-mail nenhum
  // logo abaixo (linha "if ($autoCorpo !== '')"). Sem este espelho, dryRun
  // gravava um arquivo de auto-resposta VAZIO mesmo quando a produção não
  // teria mandado nada — `ok('gravou a auto-resposta', ...)` passava sobre
  // um arquivo sem conteúdo nenhum, e uma falha de permissão em produção
  // ficava indistinguível de um dicionário simplesmente faltando.
  if ($autoCorpo !== '') {
    // Reply-To vai para o alias de destino ($cfg['to']), o MESMO endereço
    // que já recebe o e-mail de venda — não para site@, que é só remetente
    // (criado como caixa de ENVIO, não de leitura; ver deploy-formulario.md
    // §4). Sem isto, quem aperta "responder" na auto-resposta cai numa
    // caixa que ninguém olha, e a promessa de resposta em 24h feita no
    // corpo não tem como se cumprir por aquele caminho.
    @file_put_contents("{$destino}/{$stamp}-autoresposta.txt",
      "To: {$email}\nReply-To: {$cfg['to']}\nSubject: {$autoAssunto}\n\n{$autoCorpo}");
  }
  return;
}

// SMTP só é exigido a partir daqui: dryRun não precisa de credencial que
// nunca vai usar (é o que permite `npm run form:check` rodar sem SMTP
// nenhum). Mesma falha fechada da config ausente, mesma mensagem pelada —
// um `smtpPass` esquecido no va-config.php escrito à mão não pode aparecer
// como "Undefined array key" na tela de quem só queria mandar uma mensagem.
foreach (['smtpHost', 'smtpUser', 'smtpPass', 'from', 'fromName'] as $chaveSmtp) {
  $v = $cfg[$chaveSmtp] ?? null;
  if (!is_string($v) || trim($v) === '') { http_response_code(500); exit('config ausente'); }
}
if (!isset($cfg['smtpPort']) || !is_int($cfg['smtpPort']) || $cfg['smtpPort'] <= 0) {
  http_response_code(500); exit('config ausente');
}

// PHPMailer era a ÚNICA dependência deste arquivo que falhava ABERTA, e no
// único caminho que a produção percorre. Toda outra ausência daqui para cima
// sai como 500 pelado ('config ausente') sem vazar nada; um `require_once` de
// arquivo que não existe é erro FATAL do PHP: com `display_errors` ligado o
// caminho ABSOLUTO do servidor aparece na tela do visitante, com ele desligado
// a tela fica branca e nada no log deste formulário diz o motivo. Nos dois
// casos o pedido de reserva morre — e a cota do limite por IP já foi gasta lá
// atrás, antes desta linha.
//
// É o caso provável, não o exótico: a instalação é trabalho à mão descrito em
// prosa (docs/deploy-formulario.md §2), e o zip de release do GitHub extrai
// para `PHPMailer-6.x.y/`, não para `phpmailer/` — quem extrai sem renomear
// cai exatamente aqui. O caminho ainda pende de `varDir` (varDir/../phpmailer/),
// um acoplamento que ninguém adivinha lendo a config.
//
// Falha FECHADA, igual à config ausente: mesma mensagem pelada para quem
// pediu (não descobre nada do servidor) e uma linha em erros.log dizendo QUAL
// arquivo faltou — a única coisa que dá ao operador como achar o problema.
// Os três são conferidos ANTES de qualquer require: meio PHPMailer carregado
// não é estado melhor que nenhum.
$dirPhpmailer = $cfg['varDir'] . '/../phpmailer/src';
foreach (['PHPMailer.php', 'SMTP.php', 'Exception.php'] as $arqPhpmailer) {
  $caminhoPhpmailer = $dirPhpmailer . '/' . $arqPhpmailer;
  if (!is_file($caminhoPhpmailer) || !is_readable($caminhoPhpmailer)) {
    apendaComTeto($cfg['varDir'] . '/erros.log', date('c')
      . " PHPMailer ausente: {$caminhoPhpmailer} não existe ou não é legível"
      . " — ver docs/deploy-formulario.md §2\n");
    http_response_code(500);
    exit('config ausente');
  }
}
require_once $dirPhpmailer . '/PHPMailer.php';
require_once $dirPhpmailer . '/SMTP.php';
require_once $dirPhpmailer . '/Exception.php';

function enviaSmtp(array $cfg, string $para, string $assunto, string $corpo, ?array $replyTo, ?string $bcc): bool {
  $m = new PHPMailer\PHPMailer\PHPMailer(true);
  try {
    $m->isSMTP();
    $m->Host = $cfg['smtpHost'];
    $m->Port = (int)$cfg['smtpPort'];
    $m->SMTPAuth = true;
    $m->Username = $cfg['smtpUser'];
    $m->Password = $cfg['smtpPass'];
    $m->SMTPSecure = (int)$cfg['smtpPort'] === 465 ? 'ssl' : 'tls';
    $m->CharSet = 'UTF-8';
    $m->setFrom($cfg['from'], $cfg['fromName']);
    $m->addAddress($para);
    if ($bcc) { $m->addBCC($bcc); }
    if ($replyTo) { $m->addReplyTo($replyTo[0], $replyTo[1]); }
    $m->Subject = $assunto;
    $m->Body = $corpo;   // texto puro: chega inteiro em qualquer cliente
    $m->send();
    return true;
  } catch (Throwable $e) {
    // Mesmo teto de descartes.log (apendaComTeto(), definida em enviar.php e
    // já em memória: este arquivo só roda via require a partir de lá).
    // Alcançável sem credencial nenhuma — qualquer instabilidade de SMTP
    // sustentada apenda uma linha por tentativa, com o texto inteiro da
    // exceção — e sem teto era exatamente o defeito que descartes.log já
    // tinha corrigido no mesmo commit series.
    apendaComTeto($cfg['varDir'] . '/erros.log',
      date('c') . " {$para}: " . $e->getMessage() . "\n");
    return false;
  }
}

// O e-mail de venda é o que importa. Se ele falhar, o visitante tem de saber.
if (!enviaSmtp($cfg, $cfg['to'], $assunto, $corpo, [$email, $nome], $cfg['bcc'] ?: null)) {
  http_response_code(500);
  exit('envio');
}

// Auto-resposta é cortesia. Falhar aqui NÃO derruba a submissão — o pedido
// já está na caixa de quem vende, e é ela que fecha a venda.
if ($autoCorpo !== '') {
  // Mesmo alias de destino do Reply-To do dry-run acima — não um nome
  // exibido, só o endereço mesmo, igual ao que já vale para $cfg['to'].
  enviaSmtp($cfg, $email, $autoAssunto, $autoCorpo, [$cfg['to'], ''], null);
}
