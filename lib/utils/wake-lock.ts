// Wake Lock API to prevent screen from sleeping during workouts
let wakeLock: WakeLockSentinel | null = null;
let isWakeLockActive = false;

export async function requestWakeLock(): Promise<boolean> {
  try {
    // Check if Wake Lock API is supported
    if ('wakeLock' in navigator) {
      // Release existing wake lock if any
      if (wakeLock !== null) {
        await wakeLock.release();
      }
      
      wakeLock = await navigator.wakeLock.request('screen');
      isWakeLockActive = true;
      
      // Handle wake lock release events
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
        wakeLock = null;
      });
      
      console.log('Wake Lock acquired');
      return true;
    }
  } catch (err) {
    console.error('Wake Lock error:', err);
  }
  return false;
}

// Re-acquire wake lock when page becomes visible
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isWakeLockActive && wakeLock === null) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock re-acquired');
      } catch (err) {
        console.error('Failed to re-acquire wake lock:', err);
      }
    }
  });
}

export async function releaseWakeLock(): Promise<void> {
  isWakeLockActive = false;
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock released');
    } catch (err) {
      console.error('Wake Lock release error:', err);
    }
  }
}

// Audio trick to keep app active on iOS
let silentAudio: HTMLAudioElement | null = null;

export function startSilentAudio(): void {
  if (!silentAudio && typeof window !== 'undefined') {
    // Create a silent audio element
    silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILEY7Y8+SONwkdZMHz6ppTEAlJo+T1s2IcBjiS2/LNeSsFI3fH8d+RQAkVXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILFZDY8+SONwkdZMHz6ppTEAlJo+T1s2IcBjiS2/LNeSsFI3fH8d+RQAkVXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILFZDY8+SONwkdZMHz6ppTEAlJo+T1s2IcBjiS2/LNeSsFI3fH8d+RQAkVXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILFZDY8+SONwkdZMHz6ppTEAlJo+T1s2IcBjiS2/LNeSsFI3fH8d+RQAkVXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILFZDY8+SONwkdZMHz6ppTEAlJo+T1s2IcBjiS2/LNeSsFI3fH8d+RQAkVXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILFZDY8+SONwkdZMHz6ppTEAlJo+T1s2IcBjiS2/LNeSsFI3fH8d+RQAkVXrTp66hVFApGn+DyvmwhBSNyx/Hfk0ILFZDY8+SONwkeZMPy6ZlUEBFMo+T0smEfCTGU2vLOei8FL3zG8N+OQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFpXY8+OPNwkcZcP0655ZFQxPoeX0r2AhBz2V2/HLeSsDL3nH79+RQAoWZLPq7KZVFA5Jnt/yvGwiBCZ3xvHhlEMGFZXY8+OPNwkcZcP0655ZFQ1NpOX0sGAeBjiS1/PMeS0FK37J8d+RQRYY//');
    silentAudio.loop = true;
    silentAudio.volume = 0.01; // Very low volume
    silentAudio.play().catch(() => {
      // Ignore errors - user interaction might be required
    });
  }
}

export function stopSilentAudio(): void {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio = null;
  }
}