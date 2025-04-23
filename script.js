const video = document.getElementById('video');
const status = document.getElementById('status');

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error('Erreur webcam:', err));
}

let referenceDescriptor;

// Image de référence à comparer (à faire une fois au début)
async function loadReferenceImage() {
  const img = await faceapi.fetchImage('reference.jpg'); // photo enregistrée
  const detections = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  referenceDescriptor = detections.descriptor;
}

video.addEventListener('play', async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection && referenceDescriptor) {
      const distance = faceapi.euclideanDistance(detection.descriptor, referenceDescriptor);
      if (distance < 0.6) {
        status.innerText = '✅ Visage reconnu, accès autorisé';
      } else {
        status.innerText = '❌ Accès refusé, visage inconnu';
      }
    }
  }, 1000);
});

document.getElementById('imageUpload').addEventListener('change', async (e) => {
  const image = await faceapi.bufferToImage(e.target.files[0]);
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (detection && referenceDescriptor) {
    const distance = faceapi.euclideanDistance(detection.descriptor, referenceDescriptor);
    if (distance < 0.6) {
      status.innerText = '✅ Visage reconnu via image, accès autorisé';
    } else {
      status.innerText = '❌ Accès refusé, visage inconnu (upload)';
    }
  }
});
