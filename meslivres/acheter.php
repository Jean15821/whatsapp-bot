<?php
require_once __DIR__ . '/includes/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$stmt = $mysqli->prepare("SELECT * FROM books WHERE id = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
$book = $stmt->get_result()->fetch_assoc();

if (!$book) {
    require_once __DIR__ . '/includes/header.php';
    echo '<div class="container"><p class="empty-state">Livre introuvable. <a href="index.php">Retour à l\'accueil</a>.</p></div>';
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

$order_created = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['customer_name'] ?? '');
    $phone = trim($_POST['customer_phone'] ?? '');

    if ($name !== '' && $phone !== '') {
        $stmt = $mysqli->prepare("INSERT INTO orders (book_id, customer_name, customer_phone, payment_method, status) VALUES (?, ?, ?, 'natcash', 'en_attente')");
        $stmt->bind_param('iss', $book['id'], $name, $phone);
        $stmt->execute();
        $order_created = true;
    }
}

$natcash_number = get_setting($mysqli, 'natcash_number', '');
$natcash_name = get_setting($mysqli, 'natcash_name', '');
$whatsapp_number = get_setting($mysqli, 'whatsapp_number', '');

require_once __DIR__ . '/includes/header.php';
?>

<section class="buy-page container">
  <h1>Acheter : <?= h($book['title']) ?></h1>
  <p class="detail-price"><?= number_format($book['price'], 2) ?> $</p>

  <?php if (!$order_created): ?>
    <form method="POST" class="buy-form">
      <label>Nom complet
        <input type="text" name="customer_name" required>
      </label>
      <label>Numéro de téléphone
        <input type="tel" name="customer_phone" required>
      </label>
      <button type="submit" class="btn btn-primary">💰 Payer avec NatCash</button>
    </form>
  <?php else: ?>
    <div class="payment-box">
      <h2>💰 Paiement NatCash</h2>
      <p>Envoie <strong><?= number_format($book['price'], 2) ?> $</strong> au numéro NatCash suivant :</p>
      <p class="natcash-number"><?= h($natcash_number) ?></p>
      <?php if ($natcash_name): ?><p class="natcash-name">Nom : <?= h($natcash_name) ?></p><?php endif; ?>
      <p>Une fois le paiement effectué, envoie une capture d'écran de la transaction sur WhatsApp pour valider ta commande :</p>
      <a href="https://wa.me/<?= h($whatsapp_number) ?>?text=<?= urlencode('Bonjour, je viens de payer pour le livre : ' . $book['title']) ?>" target="_blank" class="btn btn-primary">💬 Envoyer la preuve sur WhatsApp</a>
      <p class="order-note">Ta commande est enregistrée et sera validée après vérification du paiement.</p>
    </div>
  <?php endif; ?>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
