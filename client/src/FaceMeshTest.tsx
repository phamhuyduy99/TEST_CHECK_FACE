import { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

export default function FaceMeshTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Initializing...');
  const [faceCount, setFaceCount] = useState(0);

  useEffect(() => {
    let detector: any = null;
    let animationId: number;
    const currentVideoRef = videoRef;

    async function init() {
      try {
        setStatus('Setting up TensorFlow backend...');
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow backend:', tf.getBackend());

        setStatus('Loading FaceMesh model...');
        detector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
        );
        setStatus('Model loaded! Starting camera...');

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (currentVideoRef.current) {
          currentVideoRef.current.srcObject = stream;
          await currentVideoRef.current.play();
          setStatus('Camera started! Detecting faces...');
          detectFaces();
        }
      } catch (err) {
        setStatus('Error: ' + (err as Error).message);
        console.error(err);
      }
    }

    async function detectFaces() {
      if (!currentVideoRef.current || !canvasRef.current || !detector) return;

      const video = currentVideoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detect = async () => {
        try {
          const faces = await detector.estimateFaces(video, { flipHorizontal: false });

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (faces && faces.length > 0) {
            setFaceCount(faces.length);
            const face = faces[0];

            // Draw bounding box
            if (face.box) {
              ctx.strokeStyle = '#00ff00';
              ctx.lineWidth = 3;
              ctx.strokeRect(face.box.xMin, face.box.yMin, face.box.width, face.box.height);
            }

            // Draw landmarks
            if (face.keypoints) {
              ctx.fillStyle = '#ff0000';
              face.keypoints.forEach((point: any) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              });
            }
          } else {
            setFaceCount(0);
          }
        } catch (err) {
          console.error('Detection error:', err);
        }

        animationId = requestAnimationFrame(detect);
      };

      detect();
    }

    init();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      const currentVideo = currentVideoRef.current;
      if (currentVideo?.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-4">FaceMesh Test</h1>
      <div className="bg-white p-4 rounded-lg mb-4">
        <p className="font-bold">Status: {status}</p>
        <p>Faces detected: {faceCount}</p>
      </div>
      <div className="relative">
        <video ref={videoRef} autoPlay playsInline muted className="rounded-lg" />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
    </div>
  );
}
