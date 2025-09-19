'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isValidSession } from '@/lib/auth';
import { userManager } from '@/lib/userManagement';
import ShaderBackground from '@/components/ShaderBackground';
import GrainyOverlay from '@/components/GrainyOverlay';

export default function GuardDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastScan, setLastScan] = useState<string>('');
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
  const scannerRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check new JWT-based authentication
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);

            // Check if user is a guard
            if (user.role !== 'guard') {
              if (user.role === 'admin') {
                router.push('/admin');
              } else if (user.role === 'influencer') {
                router.push('/influencer-dashboard');
              } else {
                router.push('/login');
              }
              return;
            }

            setCurrentUser({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            });

            setIsAuthenticated(true);
            setScanCount(0); // Initialize scan count
            setLoading(false);
            return;
          } catch (e) {
            // Invalid user data, clear auth
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }

        // Fallback: Check old session format for backward compatibility
        const session = localStorage.getItem('session');
        if (session && isValidSession(session)) {
          const decoded = JSON.parse(atob(session));

          if (decoded.role === 'guard') {
            setCurrentUser(decoded);
            setIsAuthenticated(true);
            setScanCount(0);
            setLoading(false);
            return;
          }
        }

        // Fallback: Check temporary session for demo/testing
        const tempSession = localStorage.getItem('temp_admin_session');
        if (tempSession) {
          try {
            const session = JSON.parse(tempSession);
            if (session.expires_at > Date.now() && session.role === 'guard') {
              setCurrentUser({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || 'Security Guard',
                role: 'guard'
              });
              setIsAuthenticated(true);
              setScanCount(0);
              setLoading(false);
              return;
            } else if (session.expires_at <= Date.now()) {
              localStorage.removeItem('temp_admin_session');
            }
          } catch (e) {
            localStorage.removeItem('temp_admin_session');
          }
        }

        // No valid authentication found
        router.push('/login');
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = () => {
    // Stop scanner and clean up camera resources
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setIsScanning(false);

    // Clear authentication and data
    localStorage.removeItem('session');
    localStorage.removeItem('temp_admin_session');
    localStorage.removeItem('scanner_auth');
    localStorage.removeItem('guard_info');
    router.push('/');
  };

  // Handle tab visibility to save battery and resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isScanning && scannerRef.current) {
        console.log('📱 Tab hidden, pausing scanner to save battery');
        setIsPaused(true);
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

      // Get guard info for scan logging
      const guardInfo = JSON.parse(localStorage.getItem('guard_info') || '{}');
      const sessionToken = localStorage.getItem('scanner_auth') || localStorage.getItem('temp_admin_session');

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
          scannedBy: guardInfo.id || currentUser?.id || 'guard_demo',
          guardName: guardInfo.name || currentUser?.name || 'Demo Guard',
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

          // Update scan count and last scan time
          setScanCount(prev => prev + 1);
          setLastScan(new Date().toLocaleTimeString());
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

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1);
    } else if (type === 'error') {
      oscillator.frequency.setValueAtTime(300, context.currentTime);
    } else {
      oscillator.frequency.setValueAtTime(600, context.currentTime);
    }

    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-950 to-indigo-950">
        <div className="text-white text-xl">Loading Guard Dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      <ShaderBackground />
      <GrainyOverlay />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="glass-card p-6 mb-6 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-400/30">
                <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-blue-400">
                  <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm80 248c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Security Guard Dashboard</h1>
                <p className="text-white/60">Welcome, {currentUser?.name}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white hover:bg-red-500/10 hover:border-red-400/20 border border-transparent rounded-xl transition-all duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
                <path d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scan Count */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Scans Today</p>
                  <p className="text-3xl font-bold text-white">{scanCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-400/30">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-green-400">
                    <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Last Scan */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Last Scan Time</p>
                  <p className="text-lg font-semibold text-white">{lastScan || 'No scans yet'}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-400/30">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-purple-400">
                    <path d="M256,8C119,8,8,119,8,256s111,248,248,248,248-111,248-248S393,8,256,8ZM256,448c-105.9,0-192-86.1-192-192S150.1,64,256,64s192,86.1,192,192S361.9,448,256,448Zm-16-328v144c0,8.8,7.2,16,16,16h96c8.8,0,16-7.2,16-16s-7.2-16-16-16H272V120c0-8.8-7.2-16-16-16S240,111.2,240,120Z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Scanner Status</p>
                  <p className={`text-lg font-semibold ${
                    isPaused ? 'text-yellow-400' : isScanning ? 'text-green-400' : 'text-white/60'
                  }`}>
                    {isPaused ? '⏸️ Paused' : isScanning ? '🟢 Active' : '⚪ Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 border border-white/10 rounded-2xl h-full">
              <h2 className="text-xl font-bold text-white mb-6">QR Code Scanner</h2>

              <div className="space-y-6">
                {/* Scanner Status */}
                {isScanning && (
                  <div className="text-center">
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

                {/* Camera Scanner Area */}
                {isScanning ? (
                  <div className="space-y-4">
                    {/* QR Reader Container */}
                    <div id="qr-reader" className="rounded-xl overflow-hidden border border-white/20"></div>

                    {/* Manual Input for Testing */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Manual QR Input (For Testing)</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter QR code data manually"
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm"
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
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                        >
                          Test
                        </button>
                      </div>
                      <p className="text-white/50 text-xs mt-2">Paste valid ticket QR code JSON data here for testing</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border-4 border-dashed border-white/20 bg-white/5 min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 512 512" fill="currentColor" className="text-white/50">
                          <path d="M200,0c-4.4,0-8,3.6-8,8s3.6,8,8,8h112c4.4,0,8-3.6,8-8s-3.6-8-8-8H200zM344,0c-4.4,0-8,3.6-8,8s3.6,8,8,8h32v32c0,4.4,3.6,8,8,8s8-3.6,8-8V8c0-4.4-3.6-8-8-8H344zM168,0c-4.4,0-8,3.6-8,8v40c0,4.4,3.6,8,8,8s8-3.6,8-8V16h32c4.4,0,8-3.6,8-8s-3.6-8-8-8H168z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Real Camera Scanner Ready</h3>
                      <p className="text-white/60 mb-4">Click &quot;Start Camera Scanner&quot; to begin scanning QR codes with your device camera</p>
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
                  } shadow-2xl`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        scanResult.type === 'success'
                          ? 'bg-green-500/30 text-green-400'
                          : scanResult.type === 'already_attended'
                          ? 'bg-yellow-500/30 text-yellow-400'
                          : 'bg-red-500/30 text-red-400'
                      }`}>
                        {scanResult.type === 'success' ? '✅' : scanResult.type === 'already_attended' ? '⚠️' : '❌'}
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${
                        scanResult.type === 'success'
                          ? 'text-green-400'
                          : scanResult.type === 'already_attended'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {scanResult.type === 'success'
                          ? 'Entry Granted!'
                          : scanResult.type === 'already_attended'
                          ? 'Already Checked In'
                          : 'Entry Denied'
                        }
                      </h3>
                      <p className="text-white text-lg mb-4">{scanResult.message}</p>
                      {scanResult.bookingData && (
                        <div className="bg-white/10 rounded-lg p-3 text-left">
                          <p className="text-white/80 text-sm">
                            <strong>Customer:</strong> {scanResult.bookingData.customerName || 'N/A'}
                          </p>
                          <p className="text-white/80 text-sm">
                            <strong>Event:</strong> {scanResult.bookingData.eventId || 'N/A'}
                          </p>
                          <p className="text-white/80 text-sm">
                            <strong>Booking ID:</strong> {scanResult.bookingData.id || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Scanner Controls */}
                <div className="text-center">
                  {!isScanning ? (
                    <button
                      onClick={() => setIsScanning(true)}
                      className="px-8 py-3 bg-green-500/20 text-green-400 border border-green-400/30 rounded-xl hover:bg-green-500/30 transition-all duration-300 font-semibold"
                    >
                      📱 Start Camera Scanner
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsScanning(false);
                        if (scannerRef.current) {
                          scannerRef.current.clear();
                        }
                      }}
                      className="px-8 py-3 bg-red-500/20 text-red-400 border border-red-400/30 rounded-xl hover:bg-red-500/30 transition-all duration-300 font-semibold"
                    >
                      ⏹️ Stop Scanner
                    </button>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">📋 Instructions:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Click &quot;Start Camera Scanner&quot; to activate your device camera</li>
                    <li>• Point camera at QR codes to scan them automatically</li>
                    <li>• Valid tickets will show green confirmation</li>
                    <li>• Already used tickets will show warning</li>
                    <li>• Invalid tickets will show red error</li>
                    <li>• Each successful scan is automatically logged to the database</li>
                    <li>• Scanner auto-pauses when tab is hidden to save battery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}