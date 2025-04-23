const video = document.getElementById('video');
const message = document.getElementById('message');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error('Erreur caméra', err));
}

video.addEventListener('play', async () => {
  const labeledDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    const resized = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    const results = resized.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resized[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);

      if (result.label === 'Adrien') {
        message.innerText = "✅ Bonjour Adrien !";
        message.classList.remove("text-red-500");
        message.classList.add("text-green-400");
      } else {
        message.innerText = "❌ Vous n'êtes pas Adrien ! Qui êtes-vous ?";
        message.classList.remove("text-green-400");
        message.classList.add("text-red-500");
      }
    });
  }, 1000);
});

function loadLabeledImages() {
  const labels = ['Adrien']; // Le nom que tu veux afficher
  return Promise.all(
    labels.map(async label => {
      const imgUrl = `/models/adrien.jpg`;
      const img = await faceapi.fetchImage(imgUrl);
      const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (!detections) throw new Error(`Aucun visage détecté pour ${label}`);
      return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
    })
  );
}
