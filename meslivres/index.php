<?php
require_once __DIR__ . '/includes/db.php';
$slogan_1 = get_setting($mysqli, 'slogan_1', 'Apprendre. Grandir. Transformer sa vie.');
$slogan_2 = get_setting($mysqli, 'slogan_2', 'Chaque livre ouvre une nouvelle porte.');

$books = [];
$result = $mysqli->query("SELECT b.*, c.name AS category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id ORDER BY b.created_at DESC LIMIT 20");
if ($result) { while ($row = $result->fetch_assoc()) { $books[] = $row; } }

require_once __DIR__ . '/includes/header.php';
?>

<section class="hero">
  <div class="container">
    <h1><?= h($slogan_1) ?></h1>
    <p class="hero-sub"><?= h($slogan_2) ?></p>
  </div>
</section>

<section id="catalogue" class="catalogue container">
  <h2>Notre catalogue</h2>

  <?php if (empty($books)): ?>
    <p class="empty-state">Aucun livre disponible pour le moment. Ajoute des livres depuis l'admin.</p>
  <?php else: ?>
  <div class="books-grid">
    <?php foreach ($books as $book): ?>
      <div class="book-card">
        <a href="livre.php?id=<?= (int)$book['id'] ?>">
          <img src="<?= h($book['cover_image']) ?>" alt="<?= h($book['title']) ?>" class="book-cover" loading="lazy">
        </a>
        <div class="book-info">
          <?php if ($book['category_name']): ?>
            <span class="book-category"><?= h($book['category_name']) ?></span>
          <?php endif; ?>
          <h3 class="book-title"><?= h($book['title']) ?></h3>
          <p class="book-author">par <?= h($book['author']) ?></p>
          <p class="book-price"><?= number_format($book['price'], 2) ?> $</p>
          <div class="book-actions">
            <a href="livre.php?id=<?= (int)$book['id'] ?>" class="btn btn-outline">Voir le livre</a>
            <a href="acheter.php?id=<?= (int)$book['id'] ?>" class="btn btn-primary">Acheter</a>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
