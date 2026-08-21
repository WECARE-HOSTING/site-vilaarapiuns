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

/** Lê uma chave dos dicionários copiados pelo build. Sem i18n no PHP. */
function textoAuto(string $idioma, string $chave, array $trocas): string {
  foreach ([$idioma, 'en'] as $tentativa) {
    $arq = __DIR__ . "/_i18n/{$tentativa}.json";
    if (!is_file($arq)) continue;
    $d = json_decode((string)file_get_contents($arq), true);
    $v = $d['autoresp'][$chave] ?? null;
    if (is_string($v) && $v !== '') return strtr($v, $trocas);
  }
  return '';
}

$trocas = [
  // Único dado do visitante que entra: o nome, já sem CR/LF pelo umaLinha().
  '{nome}' => $nome,
  '{whatsapp}' => 'https://wa.me/5547992067078',
];
$autoAssunto = textoAuto($idioma, 'assunto', []);
$autoCorpo   = textoAuto($idioma, 'corpo', $trocas);

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
  @file_put_contents("{$destino}/{$stamp}-autoresposta.txt",
    "To: {$email}\nSubject: {$autoAssunto}\n\n{$autoCorpo}");
  return;
}

require_once $cfg['varDir'] . '/../phpmailer/src/PHPMailer.php';
require_once $cfg['varDir'] . '/../phpmailer/src/SMTP.php';
require_once $cfg['varDir'] . '/../phpmailer/src/Exception.php';

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
    @file_put_contents($cfg['varDir'] . '/erros.log',
      date('c') . " {$para}: " . $e->getMessage() . "\n", FILE_APPEND | LOCK_EX);
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
  enviaSmtp($cfg, $email, $autoAssunto, $autoCorpo, null, null);
}
