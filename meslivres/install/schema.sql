-- Base de données "Mes Livres"
-- A importer dans MySQL (phpMyAdmin ou install/install.php)

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO settings (`key`, `value`) VALUES
('site_title', 'Mes Livres'),
('slogan_1', 'Apprendre. Grandir. Transformer sa vie.'),
('slogan_2', 'Chaque livre ouvre une nouvelle porte.'),
('whatsapp_number', '42368607'),
('natcash_number', '42368607'),
('natcash_name', 'Mes Livres'),
('contact_email', ''),
('footer_text', '© Mes Livres — Tous droits réservés')
ON DUPLICATE KEY UPDATE `key`=`key`;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categories (name, slug) VALUES
('Livres pour élèves', 'eleves'),
('Livres spirituels', 'spirituels'),
('Études bibliques', 'etudes-bibliques'),
('Livres éducatifs', 'educatifs')
ON DUPLICATE KEY UPDATE name=VALUES(name);

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cover_image VARCHAR(255) DEFAULT 'assets/img/covers/default.jpg',
  category_id INT,
  featured TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  payment_method VARCHAR(50) DEFAULT 'natcash',
  status ENUM('en_attente','valide','annule') DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
