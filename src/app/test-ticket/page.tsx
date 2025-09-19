'use client';

import { useState } from 'react';
import Button from '@/components/Button';

export default function TestTicketPage() {
  const [email, setEmail] = useState('');
  const [testType, setTestType] = useState<'basic' | 'complete'>('complete');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/test/ticket-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: email,
          testType,
        }),
      });

      const data = await response.json();
      setResults(data);

      if (data.success) {
        alert(`Test completed! Check your email (${email}) for test tickets.`);
      } else {
        alert(`Test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('Test failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-950 to-indigo-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            🧪 Ticket System Testing
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                placeholder="Enter your email to receive test tickets"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Test Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTestType('basic')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    testType === 'basic'
                      ? 'bg-purple-600/20 border-purple-500/50'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-white font-medium">Basic Test</div>
                  <div className="text-white/60 text-sm">Email service only</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType('complete')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    testType === 'complete'
                      ? 'bg-purple-600/20 border-purple-500/50'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-white font-medium">Complete Test</div>
                  <div className="text-white/60 text-sm">Full system with PDF tickets</div>
                </button>
              </div>
            </div>

            <Button
              onClick={runTest}
              disabled={loading || !email}
              className="w-full py-3 text-lg"
            >
              {loading ? 'Running Tests...' : `Run ${testType === 'basic' ? 'Basic' : 'Complete'} Test`}
            </Button>
          </div>
        </div>

        {results && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Test Results</h2>

            {results.summary && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{results.summary.totalTests}</div>
                    <div className="text-white/60 text-sm">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{results.summary.successfulTests}</div>
                    <div className="text-white/60 text-sm">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{results.summary.failedTests}</div>
                    <div className="text-white/60 text-sm">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{results.summary.successRate}</div>
                    <div className="text-white/60 text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {results.results && Object.entries(results.results).map(([testName, result]: [string, any]) => (
                <div
                  key={testName}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white capitalize">
                      {testName.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        result.success
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {result.success ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="text-white/80 text-sm">
                    {result.message || result.error}
                  </div>
                  {result.ticketId && (
                    <div className="text-white/60 text-xs mt-1">
                      Ticket ID: {result.ticketId}
                    </div>
                  )}
                  {result.pdfSize && (
                    <div className="text-white/60 text-xs mt-1">
                      PDF Size: {(result.pdfSize / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Test Details</h4>
              <div className="text-white/60 text-sm">
                <div>Test Type: {results.testType}</div>
                <div>Timestamp: {new Date(results.timestamp).toLocaleString()}</div>
                <div>Email: {email}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}