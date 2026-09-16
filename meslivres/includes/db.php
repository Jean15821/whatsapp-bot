<?php
require_once __DIR__ . '/config.php';

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($mysqli->connect_error) {
    die('Erreur de connexion à la base de données : ' . $mysqli->connect_error);
}
$mysqli->set_charset('utf8mb4');

// Récupère un réglage (settings) par sa clé, avec une valeur par défaut si absent
function get_setting($mysqli, $key, $default = '') {
    $stmt = $mysqli->prepare("SELECT `value` FROM settings WHERE `key` = ? LIMIT 1");
    $stmt->bind_param('s', $key);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        return $row['value'];
    }
    return $default;
}

// Met à jour (ou crée) un réglage
function set_setting($mysqli, $key, $value) {
    $stmt = $mysqli->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?");
    $stmt->bind_param('sss', $key, $value, $value);
    return $stmt->execute();
}

// Nettoie une chaîne pour affichage HTML sécurisé
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// Vérifie si l'admin est connecté
function admin_logged_in() {
    return isset($_SESSION['admin_id']);
}

// Redirige vers la page de connexion si non connecté (à utiliser en haut des pages admin protégées)
function require_admin() {
    if (!admin_logged_in()) {
        header('Location: login.php');
        exit;
    }
}
