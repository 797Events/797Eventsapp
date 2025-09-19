'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function QRScanner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'already_attended';
    message: string;
    bookingData?: any;
  } | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<any>(null);

  // Authentication check
  useEffect(() => {
    const checkAuthentication = async () => {
      // First check regular scanner auth
      const sessionToken = localStorage.getItem('scanner_auth');
      if (sessionToken) {
        try {
          const { isValidSession, decodeSession } = await import('@/lib/auth');
          if (isValidSession(sessionToken)) {
            const user = decodeSession(sessionToken);
            if (user && user.role === 'guard') {
              setIsAuthenticated(true);
              return;
            } else {
              // Invalid role, clear auth
              localStorage.removeItem('scanner_auth');
              localStorage.removeItem('guard_info');
            }
          } else {
            // Invalid session, clear auth
            localStorage.removeItem('scanner_auth');
            localStorage.removeItem('guard_info');
          }
        } catch (error) {
          console.error('Session validation error:', error);
          localStorage.removeItem('scanner_auth');
          localStorage.removeItem('guard_info');
        }
      }

      // Fallback: Check temporary guard session from main login
      const tempSession = localStorage.getItem('temp_admin_session');
      if (tempSession) {
        try {
          const session = JSON.parse(tempSession);
          if (session.expires_at > Date.now() && session.role === 'guard') {
            // Set guard info for scanner
            localStorage.setItem('guard_info', JSON.stringify({
              id: session.user.id,
              name: session.user.user_metadata?.full_name || 'Security Guard',
              location: 'Main Gate'
            }));
            setIsAuthenticated(true);
            return;
          }
        } catch (e) {
          console.error('Error parsing temp session:', e);
        }
      }
    };

    checkAuthentication();
  }, []);

  // Handle tab visibility to save battery and resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isScanning && scannerRef.current) {
        console.log('📱 Tab hidden, pausing scanner to save battery');
        setIsPaused(true);
        // Don't clear scanner, just pause it
      } else if (!document.hidden && isScanning && isPaused && scannerRef.current) {
        console.log('📱 Tab visible, resuming scanner');
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScanning, isPaused]);

  // Auto-timeout scanner after 10 minutes of inactivity to save battery
  useEffect(() => {
    if (!isScanning) return;

    const timeout = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes

      if (timeSinceLastActivity >= TIMEOUT_DURATION) {
        console.log('📱 Auto-stopping scanner due to inactivity');
        setIsScanning(false);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        setScanResult({
          type: 'error',
          message: 'Scanner stopped due to inactivity. Click "Start QR Scanner" to resume.'
        });
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => clearTimeout(timeout);
  }, [isScanning, lastActivity]);

  const initializeScanner = useCallback(async () => {
    try {
      // First check for camera permission
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use rear camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        // Stop the stream immediately as Html5QrcodeScanner will handle it
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error('Camera permission denied:', permissionError);
        setScanResult({
          type: 'error',
          message: 'Camera permission denied. Please allow camera access and try again.'
        });
        return;
      }

      const { Html5QrcodeScanner } = await import('html5-qrcode');

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          supportedScanTypes: [0], // Only QR codes, not other barcodes
          rememberLastUsedCamera: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 1,
          // Be more restrictive about what qualifies as a successful scan
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: false // Disable to prevent face detection
          },
          // Additional validation
          disableFlip: false,
          videoConstraints: {
            facingMode: "environment"
          }
        },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      // Add a small delay to ensure scanner is fully initialized
      setTimeout(() => {
        setScanResult({
          type: 'success',
          message: 'Camera initialized successfully! Point at QR code to scan.'
        });
        setTimeout(() => setScanResult(null), 3000);
      }, 1000);

    } catch (error) {
      console.error('Failed to initialize scanner:', error);
      setScanResult({
        type: 'error',
        message: `Failed to initialize camera: ${error instanceof Error ? error.message : 'Unknown error'}. Please check camera permissions and try again.`
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    if (isAuthenticated && isScanning) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isScanning]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Use unified authentication system with demo bypass
      const { authenticateUser, createSession } = await import('@/lib/auth');

      // Try proper authentication first, then demo bypass
      let user = await authenticateUser('security@797events.com', password);

      // Demo bypass for testing
      if (!user && password === 'Guard@123') {
        const { userManager } = await import('@/lib/userManagement');
        const guardUser = await userManager.getUserByEmail('security@797events.com');
        if (guardUser && guardUser.role === 'guard' && guardUser.is_active) {
          user = {
            id: guardUser.id,
            email: guardUser.email,
            name: guardUser.full_name,
            role: guardUser.role,
            isAdmin: false,
            exp: Date.now() + (24 * 60 * 60 * 1000)
          };
        }
      }

      if (user && user.role === 'guard') {
        // Create session token
        const sessionToken = createSession(user);
        localStorage.setItem('scanner_auth', sessionToken);
        localStorage.setItem('guard_info', JSON.stringify({
          id: user.id,
          name: user.name,
          location: 'Main Gate'
        }));

        setIsAuthenticated(true);
        setScanResult(null);
      } else {
        setScanResult({
          type: 'error',
          message: 'Invalid guard credentials. Access denied.'
        });
      }
    } catch (error) {
      console.error('Guard authentication error:', error);
      setScanResult({
        type: 'error',
        message: 'Authentication system error. Please try again.'
      });
    }
  };

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    // Prevent rapid duplicate scans and processing overlap
    if (decodedText === lastScannedCode || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setLastScannedCode(decodedText);
    setLastActivity(Date.now()); // Update activity timestamp

    try {
      console.log('🔍 Scanned text:', decodedText);

      // Enhanced QR code validation
      let qrData;

      // First check if it looks like a valid ticket QR code
      if (!decodedText || decodedText.length < 10) {
        throw new Error('Invalid QR code - too short');
      }

      // Check if it contains expected ticket-like patterns
      if (!decodedText.includes('{') || !decodedText.includes('}')) {
        throw new Error('Invalid QR code format - not a ticket QR code');
      }

      try {
        qrData = JSON.parse(decodedText);
      } catch {
        throw new Error('Invalid QR code format - not valid JSON');
      }

      // Validate that it has ticket-like structure
      if (!qrData || typeof qrData !== 'object') {
        throw new Error('Invalid QR code - not a valid ticket format');
      }

      // Check for required fields with multiple possible field names for backward compatibility
      const bookingId = qrData.bookingId || qrData.booking_id || qrData.id;
      const eventId = qrData.eventId || qrData.event_id;
      const timestamp = qrData.timestamp || qrData.created_at;
      const signature = qrData.signature || qrData.hash;

      // Validate required fields - must have at least bookingId and eventId for valid ticket
      if (!bookingId) {
        throw new Error('Not a valid ticket QR code - missing booking ID');
      }

      // Additional validation - check if it looks like a ticket structure
      const hasTicketFields = (
        bookingId &&
        (eventId || qrData.event || qrData.eventName) &&
        (timestamp || qrData.date || qrData.time)
      );

      if (!hasTicketFields) {
        throw new Error('Not a valid ticket QR code - missing required ticket information');
      }

      console.log('✅ Valid ticket QR code detected:', { bookingId, eventId });

      // Validate QR code age (prevent old/reused QR codes)
      if (timestamp) {
        const qrAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (qrAge > maxAge) {
          throw new Error('QR code has expired');
        }
      }

      // Get guard info for scan logging
      const guardInfo = JSON.parse(localStorage.getItem('guard_info') || '{}');
      const sessionToken = localStorage.getItem('scanner_auth');

      // Verify ticket with enhanced data
      const response = await fetch('/api/verify-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionToken ? `Bearer ${sessionToken}` : ''
        },
        body: JSON.stringify({
          ticketId: bookingId, // Primary identifier
          bookingId,
          eventId,
          timestamp,
          signature,
          scanTime: new Date().toISOString(),
          scannedBy: guardInfo.id || 'guard_demo',
          guardName: guardInfo.name || 'Demo Guard',
          scanLocation: guardInfo.location || 'Main Gate'
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (result.alreadyAttended) {
          setScanResult({
            type: 'already_attended',
            message: `Already checked in at ${new Date(result.attendanceTime).toLocaleString()}`,
            bookingData: result.booking
          });
          playSound('warning');
        } else {
          setScanResult({
            type: 'success',
            message: 'Valid ticket! Entry granted.',
            bookingData: result.booking
          });
          playSound('success');
        }
      } else {
        setScanResult({
          type: 'error',
          message: result.error || 'Invalid or expired ticket'
        });
        playSound('error');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      setScanResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Invalid QR code format'
      });
      playSound('error');
    }

    // Clear result after 4 seconds for better UX
    setTimeout(() => {
      setScanResult(null);
      setLastScannedCode('');
      setIsProcessing(false); // Allow new scans
    }, 4000);
  };

  const onScanFailure = (error: any) => {
    // Only log significant errors, not normal scanning failures
    if (error && typeof error === 'string' && error.includes('NotFoundException')) {
      // This is normal - just means no QR code found, keep scanning
      return;
    }

    // Log other errors for debugging
    if (error && !error.includes?.('NotFoundException')) {
      console.warn('Scanner error:', error);
    }
  };

  const playSound = (type: 'success' | 'error' | 'warning') => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    switch (type) {
      case 'success':
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        break;
      case 'error':
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
        break;
      case 'warning':
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        break;
    }

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1);
  };

  const logout = () => {
    localStorage.removeItem('scanner_auth');
    localStorage.removeItem('guard_info');
    setIsAuthenticated(false);
    setPassword('');
    setIsScanning(false);
    setScanResult(null);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🎫 QR Scanner</h1>
            <p className="text-gray-300">Event Staff Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Staff Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter staff password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              🔐 Login to Scanner
            </button>
          </form>

          {scanResult?.type === 'error' && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-center">{scanResult.message}</p>
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm font-medium mb-1">Demo Password:</p>
            <p className="text-blue-300 text-xs font-mono">Guard@123</p>
            <p className="text-blue-300/80 text-xs mt-1">Use this password to test the QR scanner</p>
          </div>
        </div>
      </div>
    );
  }

  // Scanner Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">🎫 QR Scanner</h1>
            <p className="text-gray-300">797Events Entry System</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg border border-red-500/30 transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Scanner Status */}
        {isScanning && (
          <div className="mb-4 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              isPaused
                ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                : 'bg-green-500/20 border border-green-500/30 text-green-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'
              }`}></div>
              <span className="text-sm font-medium">
                {isPaused ? '⏸️ Scanner Paused (Tab Hidden)' : '🔍 Scanner Active'}
              </span>
            </div>
          </div>
        )}

        {/* Scanner Controls */}
        <div className="mb-6 text-center">
          {!isScanning ? (
            <div>
              <button
                onClick={() => setIsScanning(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105"
              >
                📱 Start QR Scanner
              </button>

              {/* Camera Permission Info */}
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-2xl mx-auto">
                <h3 className="text-blue-400 font-semibold mb-2">📷 Camera Permission Required</h3>
                <div className="text-blue-300 text-sm space-y-1">
                  <p>• Please allow camera access when prompted</p>
                  <p>• For HTTPS/SSL: Camera works automatically</p>
                  <p>• For HTTP: May need to enable &quot;Insecure origins&quot; in browser settings</p>
                  <p>• If camera fails: Try refreshing the page or check browser permissions</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsScanning(false);
                if (scannerRef.current) {
                  scannerRef.current.clear();
                }
              }}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105"
            >
              ⏹️ Stop Scanner
            </button>
          )}
        </div>

        {/* Scanner Area */}
        {isScanning && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">📷 Point camera at QR code</h2>
              <p className="text-gray-300">Scanner will automatically detect and verify tickets</p>
            </div>

            <div className="flex justify-center">
              <div id="qr-reader" className="w-full max-w-md"></div>
            </div>

            {/* Manual Entry Fallback */}
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h3 className="text-yellow-400 font-semibold mb-2">📝 Manual Entry (Camera Issues?)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter QR code data manually"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        onScanSuccess(input.value.trim(), null);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter QR code data manually"]') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      onScanSuccess(input.value.trim(), null);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                >
                  Verify
                </button>
              </div>
              <p className="text-yellow-300 text-xs mt-2">If camera doesn&apos;t work, paste QR code JSON data here</p>
            </div>
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            scanResult.type === 'success'
              ? 'bg-green-500/20 border-green-500/50 shadow-green-500/25'
              : scanResult.type === 'already_attended'
              ? 'bg-yellow-500/20 border-yellow-500/50 shadow-yellow-500/25'
              : 'bg-red-500/20 border-red-500/50 shadow-red-500/25'
          } shadow-lg`}>
            <div className="text-center">
              <div className="text-6xl mb-4">
                {scanResult.type === 'success' ? '✅' : scanResult.type === 'already_attended' ? '⚠️' : '❌'}
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${
                scanResult.type === 'success' ? 'text-green-200' :
                scanResult.type === 'already_attended' ? 'text-yellow-200' : 'text-red-200'
              }`}>
                {scanResult.type === 'success' ? 'ENTRY GRANTED' :
                 scanResult.type === 'already_attended' ? 'ALREADY ATTENDED' : 'ACCESS DENIED'}
              </h3>
              <p className="text-white text-lg mb-4">{scanResult.message}</p>

              {scanResult.bookingData && (
                <div className="bg-white/10 rounded-lg p-4 text-left">
                  <h4 className="text-white font-semibold mb-2">📋 Booking Details:</h4>
                  <div className="text-gray-300 space-y-1">
                    <p><strong>Name:</strong> {scanResult.bookingData.name}</p>
                    <p><strong>Email:</strong> {scanResult.bookingData.email}</p>
                    <p><strong>Phone:</strong> {scanResult.bookingData.phone}</p>
                    <p><strong>Tickets:</strong> {scanResult.bookingData.quantity}</p>
                    <p><strong>Amount:</strong> ₹{scanResult.bookingData.total_amount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-white text-xl font-semibold mb-4">📖 Instructions</h3>
          <div className="text-gray-300 space-y-2">
            <p>• ✅ <strong>Green:</strong> Valid ticket - Entry granted</p>
            <p>• ⚠️ <strong>Yellow:</strong> Already attended - Duplicate scan</p>
            <p>• ❌ <strong>Red:</strong> Invalid/expired ticket - Entry denied</p>
            <p>• 🔊 <strong>Audio feedback</strong> confirms each scan result</p>
            <p>• 📱 <strong>Mobile optimized</strong> for easy handheld use</p>
          </div>
        </div>
      </div>
    </div>
  );
}