<?php
/**
 * MODELO. Copie para UM NÍVEL ACIMA do public_html, como `va-config.php`, e
 * preencha lá. O arquivo real nunca entra no repositório — que é público.
 *
 *   /home/USUARIO/va-config.php      <- o real, fora do alcance do servidor web
 *   /home/USUARIO/public_html/       <- o site
 */
return [
  'smtpHost' => 'mail.vilaarapiuns.com.br',
  'smtpPort' => 465,
  'smtpUser' => 'site@vilaarapiuns.com.br',
  'smtpPass' => '',

  'from'     => 'site@vilaarapiuns.com.br',
  'fromName' => 'Villa Arapiuns',
  'to'       => 'reservas@vilaarapiuns.com.br',
  'bcc'      => 'carlos@wecarehosting.com.br',

  /** true = grava o e-mail em arquivo em vez de enviar. É como se testa local. */
  'dryRun'   => false,
  /** Diretório de log e de contador de limite. FORA do webroot. */
  'varDir'   => '/home/USUARIO/va-var',
];
