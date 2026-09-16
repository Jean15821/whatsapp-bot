<?php
$footer_text = get_setting($mysqli, 'footer_text', '© Mes Livres');
$whatsapp_number = get_setting($mysqli, 'whatsapp_number', '');
?>
<a href="https://wa.me/<?= h($whatsapp_number) ?>" target="_blank" class="whatsapp-float" title="Me contacter sur WhatsApp">💬</a>

<footer class="site-footer">
  <div class="container">
    <p><?= h($footer_text) ?></p>
  </div>
</footer>
</body>
</html>
