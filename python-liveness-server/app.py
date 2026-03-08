from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)

class LivenessDetector:
    def __init__(self):
        self.prev_frame = None
        
    def detect_liveness(self, image_data):
        """
        Advanced liveness detection using:
        1. Texture analysis (LBP - Local Binary Patterns)
        2. Color diversity
        3. Frequency domain analysis
        4. Edge density
        """
        # Decode image
        img = Image.open(io.BytesIO(image_data))
        img_array = np.array(img)
        
        if len(img_array.shape) == 2:
            gray = img_array
        else:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # 1. Texture Analysis (LBP)
        texture_score = self._calculate_lbp_variance(gray)
        
        # 2. Color Diversity
        color_score = self._calculate_color_diversity(img_array)
        
        # 3. Frequency Analysis
        freq_score = self._calculate_frequency_score(gray)
        
        # 4. Edge Density
        edge_score = self._calculate_edge_density(gray)
        
        # Weighted scoring
        final_score = (
            texture_score * 0.35 +
            color_score * 0.25 +
            freq_score * 0.25 +
            edge_score * 0.15
        )
        
        is_real = final_score > 0.5
        confidence = min(0.99, final_score)
        
        return {
            'isReal': bool(is_real),
            'confidence': float(confidence),
            'scores': {
                'texture': float(texture_score),
                'color': float(color_score),
                'frequency': float(freq_score),
                'edge': float(edge_score)
            }
        }
    
    def _calculate_lbp_variance(self, gray):
        """Local Binary Pattern variance - real faces have higher variance"""
        lbp = np.zeros_like(gray)
        for i in range(1, gray.shape[0]-1):
            for j in range(1, gray.shape[1]-1):
                center = gray[i, j]
                code = 0
                code |= (gray[i-1, j-1] > center) << 7
                code |= (gray[i-1, j] > center) << 6
                code |= (gray[i-1, j+1] > center) << 5
                code |= (gray[i, j+1] > center) << 4
                code |= (gray[i+1, j+1] > center) << 3
                code |= (gray[i+1, j] > center) << 2
                code |= (gray[i+1, j-1] > center) << 1
                code |= (gray[i, j-1] > center) << 0
                lbp[i, j] = code
        
        variance = np.var(lbp)
        # Normalize: real faces typically have variance > 1000
        return min(1.0, variance / 2000.0)
    
    def _calculate_color_diversity(self, img):
        """Real faces have more color diversity than printed photos"""
        if len(img.shape) == 2:
            return 0.5
        
        # Calculate color histogram diversity
        hist_r = cv2.calcHist([img], [0], None, [256], [0, 256])
        hist_g = cv2.calcHist([img], [1], None, [256], [0, 256])
        hist_b = cv2.calcHist([img], [2], None, [256], [0, 256])
        
        # Entropy as diversity measure
        entropy = 0
        for hist in [hist_r, hist_g, hist_b]:
            hist = hist / hist.sum()
            entropy += -np.sum(hist * np.log2(hist + 1e-10))
        
        # Normalize: real faces typically have entropy > 15
        return min(1.0, entropy / 20.0)
    
    def _calculate_frequency_score(self, gray):
        """FFT analysis - printed photos have different frequency patterns"""
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude = np.abs(f_shift)
        
        # High frequency content indicates real texture
        rows, cols = gray.shape
        crow, ccol = rows // 2, cols // 2
        
        # Extract high frequency region
        high_freq = magnitude.copy()
        high_freq[crow-30:crow+30, ccol-30:ccol+30] = 0
        
        high_freq_energy = np.sum(high_freq)
        total_energy = np.sum(magnitude)
        
        ratio = high_freq_energy / (total_energy + 1e-10)
        
        # Real faces have more high frequency content
        return min(1.0, ratio * 10)
    
    def _calculate_edge_density(self, gray):
        """Real faces have natural edge patterns"""
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Normalize: real faces typically have 0.05-0.15 edge density
        if edge_density < 0.02:
            return 0.3  # Too smooth (printed photo)
        elif edge_density > 0.2:
            return 0.4  # Too noisy
        else:
            return min(1.0, edge_density * 8)

detector = LivenessDetector()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/check-liveness', methods=['POST'])
def check_liveness():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        image_data = image_file.read()
        
        result = detector.detect_liveness(image_data)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🚀 Python Liveness Detection Server running on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
