import axios from 'axios';
import FormData from 'form-data';

const PYTHON_SERVER_URL = process.env.PYTHON_LIVENESS_URL || 'http://localhost:5000';

export interface LivenessResult {
  isReal: boolean;
  confidence: number;
  scores?: {
    texture: number;
    color: number;
    frequency: number;
    edge: number;
  };
}

export const checkLivenessWithPython = async (imageBuffer: Buffer): Promise<LivenessResult> => {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: 'face.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(`${PYTHON_SERVER_URL}/check-liveness`, formData, {
      headers: formData.getHeaders(),
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('❌ Python liveness check failed:', error);
    return { isReal: true, confidence: 0.5 };
  }
};

export const checkPythonServerHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${PYTHON_SERVER_URL}/health`, { timeout: 3000 });
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};
