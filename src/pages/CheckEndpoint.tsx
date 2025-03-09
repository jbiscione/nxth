import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Database, User, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkParticipantsEndpoint, validateUser } from '../services/userService';

const CheckEndpoint: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [testEmail, setTestEmail] = useState('jbiscione@gmail.com');
  const [testPassword, setTestPassword] = useState('12345');
  const [authResult, setAuthResult] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const fetchEndpointData = async () => {
    try {
      setLoading(true);
      const data = await checkParticipantsEndpoint();
      setResult(data);
    } catch (err) {
      console.error('Error checking endpoint:', err);
      setError('Error checking endpoint');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEndpointData();
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchEndpointData();
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  const handleTestAuth = async () => {
    try {
      setAuthLoading(true);
      setAuthResult(null);
      
      console.log(`Testing authentication with ${testEmail} / ${testPassword}`);
      const user = await validateUser(testEmail, testPassword);
      
      if (user) {
        setAuthResult({
          success: true,
          user: user
        });
      } else {
        setAuthResult({
          success: false,
          message: 'Authentication failed'
        });
      }
    } catch (err) {
      console.error('Error testing authentication:', err);
      setAuthResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/tools" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">API Verification</h1>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin text-[#7065ef]' : 'text-gray-300'} />
          </button>
        </div>

        {/* Authentication Test */}
        <div className="px-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="font-semibold mb-3">Test Authentication</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="testEmail" className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label htmlFor="testPassword" className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  id="testPassword"
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <button
                onClick={handleTestAuth}
                disabled={authLoading}
                className="w-full py-2 bg-[#7065ef] hover:bg-[#5a51d4] rounded-lg text-white flex items-center justify-center"
              >
                {authLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Key size={16} className="mr-2" />
                    Test Login
                  </>
                )}
              </button>
            </div>

            {authResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                authResult.success 
                  ? 'bg-green-500/20 border border-green-500' 
                  : 'bg-red-500/20 border border-red-500'
              }`}>
                <div className="flex items-center mb-2">
                  {authResult.success ? (
                    <>
                      <CheckCircle size={16} className="text-green-400 mr-2" />
                      <span className="font-medium">Authentication Successful</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} className="text-red-400 mr-2" />
                      <span className="font-medium">Authentication Failed</span>
                    </>
                  )}
                </div>
                {authResult.success ? (
                  <div className="text-sm">
                    <div className="flex items-center text-green-300">
                      <User size={14} className="mr-1" />
                      <span>{authResult.user.firstName} {authResult.user.lastName}</span>
                    </div>
                    <div className="text-green-300 mt-1">
                      <span className="opacity-70">Email: </span>
                      <span>{authResult.user.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-300">
                    {authResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* API Endpoint Test */}
        <div className="px-4">
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h2 className="font-semibold mb-2">API Endpoint Test</h2>
            <p className="text-sm text-gray-400 mb-3">
              Testing direct connection to: <span className="text-[#7065ef]">acrons.net/Participants.json</span>
            </p>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#7065ef]"></div>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${result?.error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span>{result?.error ? 'Error' : 'Success'}</span>
                </div>
                {result?.status && (
                  <div className="text-sm">
                    <span className="text-gray-400">Status: </span>
                    <span>{result.status}</span>
                  </div>
                )}
                {result?.timestamp && (
                  <div className="text-sm">
                    <span className="text-gray-400">Timestamp: </span>
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {result?.data && (
            <div className="bg-gray-800 rounded-xl p-4">
              <h2 className="font-semibold mb-2">Response Data</h2>
              <div className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-60">
                {Array.isArray(result.data) ? (
                  <div>
                    <div className="text-green-400 mb-2">Found {result.data.length} participants</div>
                    {result.data.map((item: any, index: number) => (
                      <div key={index} className="mb-2 pb-2 border-b border-gray-800">
                        <div className="font-medium text-[#7065ef]">Participant {index + 1}:</div>
                        <pre className="text-gray-300 mt-1">{formatJson(item)}</pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre>{formatJson(result.data)}</pre>
                )}
              </div>
            </div>
          )}

          {result?.message && (
            <div className="bg-gray-800 rounded-xl p-4 mt-4">
              <h2 className="font-semibold mb-2">Message</h2>
              <p className="text-sm">{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckEndpoint;