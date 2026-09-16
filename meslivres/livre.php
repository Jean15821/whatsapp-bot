<?php
require_once __DIR__ . '/includes/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$stmt = $mysqli->prepare("SELECT b.*, c.name AS category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
$book = $stmt->get_result()->fetch_assoc();

if (!$book) {
    require_once __DIR__ . '/includes/header.php';
    echo '<div class="container"><p class="empty-state">Livre introuvable. <a href="index.php">Retour à l\'accueil</a>.</p></div>';
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

require_once __DIR__ . '/includes/header.php';
?>

<section class="book-detail container">
  <div class="detail-grid">
    <img src="<?= h($book['cover_image']) ?>" alt="<?= h($book['title']) ?>" class="detail-cover">
    <div class="detail-info">
      <?php if ($book['category_name']): ?>
        <span class="book-category"><?= h($book['category_name']) ?></span>
      <?php endif; ?>
      <h1><?= h($book['title']) ?></h1>
      <p class="detail-author">par <?= h($book['author']) ?></p>
      <p class="detail-price"><?= number_format($book['price'], 2) ?> $</p>
      <p class="detail-description"><?= nl2br(h($book['description'])) ?></p>
      <div class="book-actions">
        <a href="acheter.php?id=<?= (int)$book['id'] ?>" class="btn btn-primary">Acheter ce livre</a>
        <a href="https://wa.me/<?= h(get_setting($mysqli, 'whatsapp_number', '')) ?>?text=<?= urlencode('Bonjour, je suis intéressé(e) par le livre : ' . $book['title']) ?>" target="_blank" class="btn btn-outline">💬 Poser une question sur WhatsApp</a>
      </div>
    </div>
  </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
