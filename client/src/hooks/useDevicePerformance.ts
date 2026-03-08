import { useState } from 'react';

type PerformanceMode = 'auto' | 'high' | 'low';

export const useDevicePerformance = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

  let mode: PerformanceMode = 'auto';
  if (isMobile && (cores <= 4 || memory <= 4)) {
    mode = 'low';
    // console.log('📱 Low-end device, performance mode');
  } else if (cores >= 8 && memory >= 8) {
    mode = 'high';
    // console.log('🚀 High-end device, quality mode');
  } else {
    // console.log('⚖️ Mid-range device, balanced mode');
  }

  const [performanceMode] = useState<PerformanceMode>(mode);

  const getCheckInterval = () => {
    return performanceMode === 'low' ? 1500 : performanceMode === 'high' ? 800 : 1000;
  };

  const getLivenessFrameSkip = () => {
    return performanceMode === 'low' ? 4 : performanceMode === 'high' ? 2 : 3;
  };

  return {
    performanceMode,
    checkInterval: getCheckInterval(),
    livenessFrameSkip: getLivenessFrameSkip(),
  };
};
