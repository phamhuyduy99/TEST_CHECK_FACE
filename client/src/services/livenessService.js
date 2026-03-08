import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

class LivenessService {
  constructor() {
    this.isLoaded = false;
    this.faceMeshModel = null;
  }

  async loadModels() {
    if (this.isLoaded) return;
    try {
      console.log('🔄 Loading FaceMesh...');
      this.faceMeshModel = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'tfjs', maxFaces: 1 }
      );
      this.isLoaded = true;
      console.log('✅ FaceMesh loaded');
    } catch (err) {
      console.error('❌ FaceMesh load failed:', err);
    }
  }

  async detectFace(video) {
    if (!this.faceMeshModel) return null;
    try {
      const faces = await this.faceMeshModel.estimateFaces(video, { flipHorizontal: false });
      return faces && faces.length > 0 ? faces[0] : null;
    } catch (err) {
      return null;
    }
  }

  async checkLiveness(video) {
    const face = await this.detectFace(video);
    if (!face) return { isReal: false, confidence: 0 };
    
    // Simple check: if face detected = real
    return { isReal: true, confidence: 0.9 };
  }

  clearCache() {}
}

export default new LivenessService();
