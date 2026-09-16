<?php
if (!isset($mysqli)) { require_once __DIR__ . '/db.php'; }
$site_title = get_setting($mysqli, 'site_title', 'Mes Livres');
$whatsapp_number = get_setting($mysqli, 'whatsapp_number', '');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= h($site_title) ?> — Librairie numérique</title>
<link rel="stylesheet" href="<?= SITE_URL ?>/assets/css/style.css">
</head>
<body>
<header class="site-header">
  <div class="container header-inner">
    <a href="<?= SITE_URL ?>/index.php" class="logo"><?= h($site_title) ?></a>
    <nav class="main-nav">
      <a href="<?= SITE_URL ?>/index.php">Accueil</a>
      <a href="<?= SITE_URL ?>/index.php#catalogue">Catalogue</a>
      <a href="https://wa.me/<?= h($whatsapp_number) ?>" target="_blank" class="nav-whatsapp">💬 WhatsApp</a>
      <a href="<?= SITE_URL ?>/admin/login.php" class="nav-adm" title="Administration">⚙️</a>
    </nav>
  </div>
</header>
