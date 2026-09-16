import json
import random
import os

class BibleTheologySkill:
    def __init__(self):
        self.name = "Bible et Théologie"
        self.version = "1.0"
        self.versets = self.load_versets()
        self.doctrines = self.load_doctrines()
    
    def load_versets(self):
        try:
            with open('data/versets.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Erreur chargement versets: {e}")
            return [
                {"ref": "Jean 3:16", "text": "Car Dieu a tant aimé le monde qu'il a donné son Fils unique..."},
                {"ref": "Psaumes 23:1", "text": "L'Éternel est mon berger, je ne manquerai de rien."},
                {"ref": "Romains 8:28", "text": "Nous savons que toutes choses concourent au bien de ceux qui aiment Dieu."}
            ]
    
    def load_doctrines(self):
        return {
            "trinité": "Dieu est un en trois personnes distinctes : Père, Fils (Jésus) et Saint-Esprit.",
            "salut": "Le salut est un don gratuit de Dieu, reçu par la grâce, à travers la foi en Jésus-Christ.",
            "révélation": "Dieu se révèle à travers la nature et la Bible.",
            "église": "L'Église est le corps de Christ, composé de tous les croyants.",
            "résurrection": "Jésus est ressuscité le troisième jour, victorieux sur la mort."
        }
    
    def handle(self, request):
        text = request.lower()
        
        if "verset" in text or "citation" in text or "parole" in text:
            return self.get_random_verse()
        
        livres = ["genèse", "exode", "lévitique", "nombres", "deutéronome", "josué", "juges", "ruth", 
                  "1 samuel", "2 samuel", "1 rois", "2 rois", "1 chroniques", "2 chroniques", 
                  "esdras", "néhémie", "esther", "job", "psaumes", "proverbes", "ecclésiaste", 
                  "cantique", "ésaïe", "jérémie", "lamentations", "ézéchiel", "daniel", 
                  "osée", "joël", "amos", "abdias", "jonas", "michée", "nahum", "habakuk", 
                  "sophonie", "aggée", "zacharie", "malachie", "matthieu", "marc", "luc", "jean", 
                  "actes", "romains", "1 corinthiens", "2 corinthiens", "galates", "éphésiens", 
                  "philippiens", "colossiens", "1 thessaloniciens", "2 thessaloniciens", 
                  "1 timothée", "2 timothée", "tite", "philémon", "hébreux", "jacques", 
                  "1 pierre", "2 pierre", "1 jean", "2 jean", "3 jean", "jude", "apocalypse"]
        
        if any(book in text for book in livres):
            return self.get_book_info(text)
        
        if any(doctrine in text for doctrine in self.doctrines.keys()):
            return self.get_doctrine(text)
        
        if "aide" in text or "help" in text:
            return self.get_help()
        
        return self.get_default_response()
    
    def get_random_verse(self):
        v = random.choice(self.versets)
        return f"📖 **{v['ref']}**\n\n{v['text']}"
    
    def get_book_info(self, text):
        books_info = {
            "genèse": "📚 **Genèse** - Premier livre de la Bible. Raconte la création, le déluge, et les patriarches (Abraham, Isaac, Jacob).",
            "exode": "📚 **Exode** - Récit de la sortie d'Égypte sous Moïse et la réception des 10 commandements.",
            "psaumes": "📚 **Psaumes** - Recueil de 150 chants et prières, écrits principalement par David.",
            "matthieu": "📚 **Matthieu** - Premier évangile, présente Jésus comme le Messie promis.",
            "jean": "📚 **Jean** - Évangile théologique, met l'accent sur la divinité de Jésus.",
            "romains": "📚 **Romains** - La grande épître de Paul sur la justification par la foi.",
            "apocalypse": "📚 **Apocalypse** - Révélation prophétique sur la fin des temps."
        }
        for key, value in books_info.items():
            if key in text:
                return value
        return "📚 Ce livre fait partie de la Bible. Dis-moi un livre spécifique pour en savoir plus !"
    
    def get_doctrine(self, text):
        for key, value in self.doctrines.items():
            if key in text:
                return f"✝️ **{key.capitalize()}**\n\n{value}"
        return "✝️ Quelle doctrine veux-tu approfondir ? (Trinité, Salut, Église...)"
    
    def get_help(self):
        return """📖 **Aide - Bible et Théologie**

Voici ce que je peux faire :
• **Verset** : je te donne un verset aléatoire
• **Nom du livre** : infos sur un livre (ex: "Genèse")
• **Doctrine** : explication (Trinité, Salut...)
• **Référence** : cherche un passage

Que veux-tu explorer aujourd'hui ?"""
    
    def get_default_response(self):
        return """🙏 La Bible est la Parole de Dieu. 
Veux-tu :
• Un verset ?
• En savoir plus sur un livre ?
• Étudier une doctrine ?

Dis-moi ce que tu cherches !"""
