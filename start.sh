#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
tmux kill-session -t quizbot 2>/dev/null
tmux new-session -d -s quizbot "cd ~/whatsapp-bot && node index.js"
echo "✅ Bot lancé en arrière-plan (session tmux: quizbot)"
echo "Pour voir les logs : tmux attach -t quizbot"
echo "Pour détacher sans arrêter : Ctrl+B puis D"
