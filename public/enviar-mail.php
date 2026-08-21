<?php
/**
 * Entrega. Isolado do enviar.php de propósito: validação se testa sem
 * credencial nenhuma, entrega precisa de SMTP. A Tarefa 6 troca o corpo
 * desta função pelo envio real.
 *
 * Variáveis do escopo do enviar.php: $cfg, $assunto, $corpo, $nome, $email, $idioma.
 *
 * Alcançável direto em /enviar-mail.php, e chamado assim vazaria caminho de
 * servidor em aviso do PHP. A guarda fecha a porta.
 */
if (!isset($cfg, $assunto, $corpo, $nome, $email, $idioma)) { http_response_code(404); exit; }

$destino = $cfg['varDir'] . '/enviados';
if (!is_dir($destino)) { @mkdir($destino, 0700, true); }
$stamp = date('Ymd-His') . '-' . substr(hash('sha256', $email . microtime()), 0, 6);
file_put_contents(
  "{$destino}/{$stamp}.txt",
  "To: {$cfg['to']}\nBcc: {$cfg['bcc']}\nReply-To: {$nome} <{$email}>\n"
  . "Subject: {$assunto}\n\n{$corpo}"
);
