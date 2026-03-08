/**
 * Anti-Spoofing Test & Demo
 * Kiểm tra các phương pháp phát hiện giả mạo
 */

import antiSpoofingService from './antiSpoofingService';

class AntiSpoofingTest {
  /**
   * Test Face Size Consistency
   */
  testFaceSizeConsistency() {
    console.log('🧪 Testing Face Size Consistency...');
    
    // Simulate stable face (video/photo)
    console.log('\n1. Stable Face (Video/Photo):');
    antiSpoofingService.reset();
    for (let i = 0; i < 20; i++) {
      const score = antiSpoofingService.checkFaceSizeConsistency({
        width: 200 + Math.random() * 2, // Very stable
        height: 200 + Math.random() * 2
      });
      if (i === 19) console.log('   Score:', score.toFixed(2), score < 0.5 ? '❌ SUSPICIOUS' : '✅ OK');
    }

    // Simulate natural movement
    console.log('\n2. Natural Movement (Real Person):');
    antiSpoofingService.reset();
    for (let i = 0; i < 20; i++) {
      const score = antiSpoofingService.checkFaceSizeConsistency({
        width: 200 + Math.random() * 20, // Natural variation
        height: 200 + Math.random() * 20
      });
      if (i === 19) console.log('   Score:', score.toFixed(2), score > 0.5 ? '✅ NATURAL' : '❌ FAIL');
    }
  }

  /**
   * Test Frame Rate Consistency
   */
  testFrameRateConsistency() {
    console.log('\n🧪 Testing Frame Rate Consistency...');
    
    // Simulate perfect frame rate (video)
    console.log('\n1. Perfect Frame Rate (Video):');
    antiSpoofingService.reset();
    antiSpoofingService.lastFrameTime = performance.now();
    
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const score = antiSpoofingService.checkFrameRateConsistency();
        if (i === 19) console.log('   Score:', score.toFixed(2), score < 0.5 ? '❌ VIDEO REPLAY' : '✅ OK');
      }, 33.33 * i); // Perfect 30fps
    }

    // Simulate natural jitter (webcam)
    console.log('\n2. Natural Jitter (Webcam):');
    setTimeout(() => {
      antiSpoofingService.reset();
      antiSpoofingService.lastFrameTime = performance.now();
      
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const score = antiSpoofingService.checkFrameRateConsistency();
          if (i === 19) console.log('   Score:', score.toFixed(2), score > 0.5 ? '✅ NATURAL' : '❌ FAIL');
        }, (33 + Math.random() * 10) * i); // Jittery
      }
    }, 1000);
  }

  /**
   * Test Session Duration
   */
  testSessionDuration() {
    console.log('\n🧪 Testing Session Duration...');
    
    // Short session (loop)
    console.log('\n1. Short Session (< 5s):');
    antiSpoofingService.reset();
    antiSpoofingService.frameCount = 60; // Many frames
    
    setTimeout(() => {
      const score = antiSpoofingService.checkSessionDuration();
      console.log('   Score:', score.toFixed(2), score < 0.5 ? '❌ SHORT LOOP' : '✅ OK');
    }, 3000);

    // Normal session
    console.log('\n2. Normal Session (> 5s):');
    setTimeout(() => {
      antiSpoofingService.reset();
      antiSpoofingService.frameCount = 60;
      
      setTimeout(() => {
        const score = antiSpoofingService.checkSessionDuration();
        console.log('   Score:', score.toFixed(2), score > 0.5 ? '✅ NATURAL' : '❌ FAIL');
      }, 6000);
    }, 4000);
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🚀 Starting Anti-Spoofing Tests...\n');
    console.log('=' .repeat(50));
    
    this.testFaceSizeConsistency();
    
    setTimeout(() => {
      console.log('\n' + '='.repeat(50));
      this.testFrameRateConsistency();
    }, 1000);
    
    setTimeout(() => {
      console.log('\n' + '='.repeat(50));
      this.testSessionDuration();
    }, 3000);

    setTimeout(() => {
      console.log('\n' + '='.repeat(50));
      console.log('\n✅ All tests completed!');
      console.log('\n📊 Summary:');
      console.log('   - Face Size Consistency: Detects stable faces (video/photo)');
      console.log('   - Frame Rate Consistency: Detects perfect frame rates (video)');
      console.log('   - Session Duration: Detects short loops');
      console.log('\n💡 Tip: Combine all methods for best results!');
    }, 12000);
  }
}

// Export for testing
export default new AntiSpoofingTest();

// Auto-run in development
if (import.meta.env.DEV) {
  console.log('💡 To run tests, use: antiSpoofingTest.runAllTests()');
}
