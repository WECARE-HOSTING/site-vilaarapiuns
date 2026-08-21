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

// @ e retorno checado, pelos dois motivos:
//
// 1. varDir sem permissão de escrita é A falha do primeiro deploy por FTP.
//    Sem o @, o PHP imprime um aviso com o caminho ABSOLUTO do servidor;
//    depois disso o responde() do enviar.php morre em "headers already sent",
//    o 303 nunca sai, e quem está sem JS recebe uma parede de caminhos de
//    servidor no lugar da página de confirmação.
// 2. Falha engolida não pode passar por sucesso. Aqui o arquivo É a entrega:
//    se ele não foi escrito, ninguém recebeu nada, e mandar o visitante para
//    a página de "pedido enviado" é mentir para ele e perder a reserva em
//    silêncio. 500 pelado — nenhum caminho, nenhum motivo.
$gravou = @file_put_contents(
  "{$destino}/{$stamp}.txt",
  "To: {$cfg['to']}\nBcc: {$cfg['bcc']}\nReply-To: {$nome} <{$email}>\n"
  . "Subject: {$assunto}\n\n{$corpo}"
);
if ($gravou === false) { http_response_code(500); exit('falha na entrega'); }
