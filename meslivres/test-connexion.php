<?php
require_once __DIR__ . '/includes/db.php';

echo "<h2>Test de connexion — Mes Livres</h2>";
echo "<p>✅ Connexion MySQL réussie.</p>";

$result = $mysqli->query("SHOW TABLES");
echo "<p>Tables trouvées :</p><ul>";
while ($row = $result->fetch_array()) {
    echo "<li>" . htmlspecialchars($row[0]) . "</li>";
}
echo "</ul>";

$count = $mysqli->query("SELECT COUNT(*) AS c FROM settings")->fetch_assoc();
echo "<p>Réglages en base : " . $count['c'] . "</p>";
