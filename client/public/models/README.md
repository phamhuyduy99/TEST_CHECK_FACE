# Download face-api.js models

Tải models từ: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Cần tải các file sau vào thư mục `public/models/`:

## Tiny Face Detector (nhẹ, nhanh)

- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1

## Face Landmarks

- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1

## Face Recognition

- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

## Cách tải nhanh:

```bash
cd client/public/models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```
