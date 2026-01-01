'use client';

export default function TestMapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleTestMap = () => {
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

    // Test if script loads
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding`;

    script.onload = () => {
      console.log('✅ Google Maps loaded successfully');
      alert('Google Maps API is working! API key is valid.');
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps:', error);
      alert('Failed to load Google Maps. Check console for details.');
    };

    document.head.appendChild(script);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Google Maps API Test</h1>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-2">API Key Status:</h2>
            <p className="text-sm font-mono break-all">
              {apiKey ? (
                <span className="text-green-600">
                  ✅ Found: {apiKey.substring(0, 15)}...{apiKey.substring(apiKey.length - 4)}
                </span>
              ) : (
                <span className="text-red-600">❌ NOT FOUND - Check .env file</span>
              )}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Required APIs (must be enabled in Google Cloud):</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Maps JavaScript API</li>
              <li>Places API</li>
              <li>Geocoding API</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Setup Steps:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
              <li>Enable billing (credit card required, $200 free monthly credit)</li>
              <li>Enable the 3 APIs listed above</li>
              <li>Copy API key to .env file as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
              <li>Restart dev server</li>
            </ol>
          </div>

          <button
            onClick={handleTestMap}
            disabled={!apiKey}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {apiKey ? 'Test API Key' : 'API Key Not Found'}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Open browser console (F12) to see detailed error messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
