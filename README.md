Pour tester le fonctionnement de la reconnaissance faciale, cliquer sur [ce lien](https://adriendeval.github.io/face-login/).

Sur cette page de démo, votre visage ne sera pas reconnu. Veuillez télécharger l'image `[reference.jpg](https://github.com/adriendeval/face-login/blob/main/reference.jpg)` et l'envoyer.

## Comment l'utiliser ?
Si vous souhaitez télécharger ce dépôt afin de l'utiliser en local sur votre machine, vous pouvez ouvrir votre explorateur de fichiers et vous rendre dans le dossier dans lequel ce dépôt sera cloné.
Un fois fait, tapez `cmd` dans la barre d'adresse de l'explorateur, ce qui ouvrira le terminal. Ensuite, tapez `git clone https://github.com/adriendeval/face-login.git`, puis `code face-login`. Cela ouvrira votre éditeur de texte. Nous vous conseillons d'utiliser **Visual Studio Code**.

Ensuite, lancez le serveur web (avec PHP par exemple, s'il est installé sur votre machine) en faisant `Ctrl` + `J` pour ouvrir le terminal Visual Studio Code puis entrez `php -S localhost:8000`.

Dans votre navigateur, ouvrez `http://localhost:8000` et admirez le résultat. Si vous souhaitez modifier l'image de référence, remplacer `reference.jpg` par l'image de votre choix. Assurez-vous qu'elle soit nommée `reference.jpg`.

Par défaut, l'image de référence représente une personne aléatoire et le nom associé à l'image est `Utilisateur`. Pour modifier le nom, allez à la ligne 4 du fichier `script.js` et remplacez `Utilisateur` par ce que vous souhaitez.

> [!NOTE]
> **Veuillez ne pas toucher au dossier `models` !**