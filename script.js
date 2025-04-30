const video = document.getElementById('video');
const messageDiv = document.getElementById('message');
const loadingMessage = document.getElementById('loading-message');
const referenceImageName = 'Utilisateur'; // Le nom associé à ton image
const referenceImagePath = 'reference.jpg'; // Le chemin vers ton image
const modelPath = './models'; // Chemin vers le dossier des modèles

const imageUploadContainer = document.getElementById('image-upload-container');
const imageUpload = document.getElementById('image-upload');

let labeledFaceDescriptors; // Pour stocker le descripteur de ton visage
let faceMatcher; // L'outil pour comparer les visages

// ----- Chargement des modèles de face-api.js -----
async function loadModels() {
    try {
        // Modèle pour détecter les visages
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        // Modèle pour détecter les points de repère du visage (yeux, nez, bouche...)
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
        // Modèle pour calculer le descripteur du visage (permet la reconnaissance)
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
        // Modèle pour estimer l'âge et le genre (optionnel, non utilisé ici)
        // await faceapi.nets.ageGenderNet.loadFromUri(modelPath);
        // Modèle pour les expressions faciales (optionnel, non utilisé ici)
        // await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
        console.log("Modèles chargés avec succès !");
        return true;
    } catch (error) {
        console.error("Erreur lors du chargement des modèles:", error);
        loadingMessage.textContent = "Erreur de chargement des modèles.";
        return false;
    }
}

// ----- Préparation de la reconnaissance (ton image de référence) -----
async function createLabeledFaceDescriptors() {
    try {
        const img = await faceapi.fetchImage(referenceImagePath);
        // Détecter le visage dans l'image de référence et calculer son descripteur
        const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detections) {
            console.error(`Aucun visage détecté dans ${referenceImagePath}`);
            loadingMessage.textContent = "Erreur: Aucun visage dans l'image de référence.";
            return null;
        }

        const descriptors = [detections.descriptor];
        return new faceapi.LabeledFaceDescriptors(referenceImageName, descriptors);

    } catch (error) {
        console.error("Erreur lors de la création des descripteurs:", error);
        loadingMessage.textContent = "Erreur de traitement de l'image de référence.";
        return null;
    }
}

// ----- Démarrage de la webcam OU fallback upload -----
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        video.style.display = "block";
        imageUploadContainer.style.display = "none";
        console.log("Webcam démarrée.");
    } catch (err) {
        console.warn("Webcam non disponible, passage à l'upload d'image.");
        video.style.display = "none";
        imageUploadContainer.style.display = "block";
        messageDiv.textContent = "Webcam indisponible. Veuillez uploader une image.";
        setupImageUpload();
    }
}

// ----- Gestion de l'upload d'image -----
function setupImageUpload() {
    imageUpload.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const img = await loadImageFromFile(file);

        messageDiv.textContent = "Analyse de l'image...";
        await recognizeFromImage(img);
    });
}

// Utilitaire pour charger une image depuis un fichier
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Reconnaissance sur une image uploadée
async function recognizeFromImage(img) {
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (detections.length > 0 && faceMatcher) {
        const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));
        const isAdrienDetected = results.some(result => result.label === referenceImageName);

        if (isAdrienDetected) {
            localStorage.setItem('isAuthenticated', true);
            window.location.href = "documents.html";
        } else {
            messageDiv.textContent = "Visage non reconnu, veuillez réessayer !";
            messageDiv.classList.add("bg-red-500", "text-white");
        }
    } else {
        messageDiv.textContent = "Aucun visage détecté.";
    }
}

// ----- Boucle de reconnaissance -----
async function runRecognition() {
    // Crée un canvas interne pour traiter l'image (plus fiable que d'utiliser directement la vidéo)
    const displaySize = { width: video.width, height: video.height };
    const canvas = faceapi.createCanvasFromMedia(video);
    // document.body.append(canvas) // Décommente pour voir le canvas interne

    // Optionnel : ajuste la taille du canvas overlay si tu veux dessiner dessus
    const overlayCanvas = document.getElementById('overlay');
    faceapi.matchDimensions(overlayCanvas, displaySize);

    console.log("Début de la reconnaissance...");
    messageDiv.textContent = "Analyse en cours...";

    setInterval(async () => {
        // Détecte tous les visages dans l'image actuelle de la vidéo
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        // Optionnel: Redimensionne les résultats pour correspondre à la taille d'affichage
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Optionnel : Efface l'overlay et dessine les détections (pour le debug)
        // overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        // faceapi.draw.drawDetections(overlayCanvas, resizedDetections);
        // faceapi.draw.drawFaceLandmarks(overlayCanvas, resizedDetections);

        if (detections.length > 0 && faceMatcher) {
            // Pour chaque visage détecté, trouve la meilleure correspondance
            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

            // Vérifie si "Adrien" est parmi les correspondances trouvées
            const isAdrienDetected = results.some(result => result.label === referenceImageName);

            if (isAdrienDetected) {
                messageDiv.textContent = `Bonjour ${referenceImageName} !`;
            } else {
                messageDiv.textContent = "Qui êtes-vous ?";
            }
        } else if (faceMatcher) {
            // Aucun visage détecté
            messageDiv.textContent = "Aucun visage détecté.";
        } else {
            // faceMatcher n'est pas encore prêt
            messageDiv.textContent = "Préparation de la reconnaissance...";
        }

    }, 200); // Exécute la détection toutes les 200ms (5 fois par seconde)
}

// ----- Fonction principale d'initialisation -----
async function initialize() {
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) return; // Arrête si les modèles n'ont pas chargé

    labeledFaceDescriptors = await createLabeledFaceDescriptors();
    if (!labeledFaceDescriptors) return; // Arrête si l'image de référence n'a pas pu être traitée

    // Crée l'outil de comparaison avec le descripteur d'Adrien
    // Le deuxième argument (0.5) est le seuil de tolérance. Plus il est bas, plus la correspondance doit être exacte.
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
    console.log("FaceMatcher créé.");

    loadingMessage.style.display = 'none'; // Cache le message de chargement
    messageDiv.textContent = "Démarrage de la webcam...";
    await startVideo(); // Démarre la webcam

    // Attend que la vidéo commence à jouer pour lancer la reconnaissance
    video.addEventListener('playing', runRecognition);

    recognizeFromVideo();
}

// Lancement
initialize();