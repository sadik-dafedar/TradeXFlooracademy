'use client';

/**
 * Screen Capture and Recording Detection Library
 * Detects various screen recording and capture attempts
 */

// Known recording software process names and signatures
const KNOWN_RECORDING_SOFTWARE = [
  'obs64.exe', 'obs32.exe',           // OBS Studio
  'Bandicam.exe', 'bdcam.exe',        // Bandicam
  'CamStudio.exe',                    // CamStudio
  'Fraps.exe',                       // Fraps
  'ShareX.exe',                      // ShareX
  'Snagit32.exe', 'SnagIt.exe',      // Snagit
  'ffmpeg.exe',                      // FFmpeg
  'vlc.exe',                         // VLC (can record)
  'chrome.exe',                      // Chrome (screen recording extensions)
  'firefox.exe',                     // Firefox (screen recording extensions)
  'ScreenToGif.exe',                 // ScreenToGif
  'LICEcap.exe',                     // LICEcap
  'Captura.exe',                     // Captura
  'SimpleScreenRecorder.exe',        // Simple Screen Recorder
  'kazam',                           // Kazam (Linux)
  'recordmydesktop',                 // RecordMyDesktop (Linux)
];

// Canvas-based detection methods
export async function detectScreenCapture() {
  try {
    // Method 1: Canvas fingerprinting anomaly
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return false;
    
    // Draw test pattern
    ctx.fillStyle = 'rgb(100, 150, 200)';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'rgb(200, 100, 150)';
    ctx.fillRect(50, 50, 50, 50);
    
    const imageData1 = ctx.getImageData(0, 0, 100, 100);
    
    // Wait and check if canvas was captured
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageData2 = ctx.getImageData(0, 0, 100, 100);
    
    // Compare fingerprints
    const fingerprint1 = getCanvasFingerprint(imageData1);
    const fingerprint2 = getCanvasFingerprint(imageData2);
    
    if (fingerprint1 !== fingerprint2) {
      return { 
        method: 'canvas_fingerprint_changed',
        details: 'Canvas content was captured and modified'
      };
    }
    
    // Method 2: WebGL context detection
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Virtual machine renderers often indicate screen capture
        if (renderer.includes('VMware') || renderer.includes('VirtualBox')) {
          return {
            method: 'virtual_renderer_detected',
            details: `Virtual renderer detected: ${renderer}`
          };
        }
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Screen capture detection error:', error);
    return false;
  }
}

// Get canvas fingerprint
function getCanvasFingerprint(imageData) {
  let hash = 0;
  const data = imageData.data;
  
  for (let i = 0; i < Math.min(data.length, 1000); i += 4) {
    const pixelValue = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    hash = ((hash << 5) - hash) + pixelValue;
    hash |= 0; // Convert to 32-bit integer
  }
  
  return hash.toString();
}

// Detect recording software processes (browser-based detection)
export async function detectRecordingSoftware() {
  try {
    // Method 1: Check for known recording software in browser extensions
    const extensionChecks = [
      // Check for screen recording extensions
      () => checkForExtension('chrome-extension://'), // Chrome extensions
      () => checkForExtension('moz-extension://'),    // Firefox extensions
    ];
    
    for (const check of extensionChecks) {
      const result = await check();
      if (result) return result;
    }
    
    // Method 2: Performance monitoring anomalies
    const performance = window.performance;
    if (performance && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      // Unusual painting patterns might indicate recording
      if (paintEntries.length > 50) {
        return {
          name: 'Performance Anomaly',
          process: 'Unusual rendering activity detected'
        };
      }
    }
    
    // Method 3: Media devices enumeration
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        
        // Multiple virtual cameras might indicate recording software
        const virtualDevices = videoInputs.filter(device => 
          device.label.toLowerCase().includes('virtual') ||
          device.label.toLowerCase().includes('obs') ||
          device.label.toLowerCase().includes('bandicam')
        );
        
        if (virtualDevices.length > 0) {
          return {
            name: 'Virtual Camera Detected',
            process: virtualDevices.map(d => d.label).join(', ')
          };
        }
      } catch (error) {
        // Permission denied is normal, continue
      }
    }
    
    // Method 4: Audio context analysis
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        
        // Check for unusual audio processing that might indicate recording
        if (analyser.fftSize > 32768) {
          return {
            name: 'Audio Processing Anomaly',
            process: 'Unusual audio processing detected'
          };
        }
      }
    } catch (error) {
      // Audio context might be blocked
    }
    
    return false;
  } catch (error) {
    console.warn('Recording software detection error:', error);
    return false;
  }
}

// Check for browser extensions (limited capability in modern browsers)
function checkForExtension(prefix) {
  return new Promise((resolve) => {
    // This is a simplified check - modern browsers limit extension detection
    // for security reasons
    const testElement = document.createElement('div');
    testElement.style.display = 'none';
    
    // Try to detect extension injection
    document.body.appendChild(testElement);
    
    setTimeout(() => {
      document.body.removeChild(testElement);
      // In a real implementation, you'd check for extension-specific behaviors
      resolve(false);
    }, 100);
  });
}

// Detect screenshot key combinations (already handled in media-protection.js)
export function detectScreenshotAttempt(event) {
  const keyCombinations = [
    { key: 'PrintScreen', ctrl: false, shift: false, alt: false },
    { key: 'p', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+P
    { key: 's', ctrl: true, shift: false, alt: false }, // Ctrl+S
  ];
  
  return keyCombinations.some(combo => 
    event.key.toLowerCase() === combo.key &&
    event.ctrlKey === combo.ctrl &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt
  );
}

// Detect window capture/share attempts
export function detectWindowSharing() {
  // Check for fullscreen API usage that might indicate sharing
  if (document.fullscreenElement) {
    // Additional checks could be implemented here
    return {
      method: 'fullscreen_sharing_detected',
      element: document.fullscreenElement.tagName
    };
  }
  
  return false;
}

// Export utility functions
export const ScreenDetector = {
  detectScreenCapture,
  detectRecordingSoftware,
  detectScreenshotAttempt,
  detectWindowSharing,
  KNOWN_RECORDING_SOFTWARE
};