import { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

function App() {
  const { user, login, logout } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [essentialInfo, setEssentialInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnrichLead = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    setLoading(true);
    setError('');
    setEssentialInfo(null);

    try {
      const token = localStorage.getItem("idToken");
      const response = await axios.post(
        'http://localhost:8000/api/enrich',
        { companyName: companyName.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('API Response:', response.data); // Debug log

      const data = response.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      setEssentialInfo(data);
      
    } catch (err) {
      console.error('Enrichment Error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Error fetching company data'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App p-4">
      {!user ? (
        <button 
          onClick={login}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login with Google
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Lead Enrichment Tool</h2>
            <button 
              onClick={logout}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={handleEnrichLead}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Enrich Lead'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {essentialInfo && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                {essentialInfo.profile_photo && (
                  <img
                    src={essentialInfo.profile_photo}
                    alt={`${essentialInfo.company_name || 'Company'} logo`}
                    className="w-16 h-16 object-contain rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                )}
                <h3 className="text-xl font-semibold">
                  {essentialInfo.company_name || companyName}
                </h3>
              </div>

              <div className="grid gap-3">
                {Object.entries(essentialInfo).map(([key, value]) => (
                  <div key={key}>
                    <p>
                      <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> 
                      {Array.isArray(value) ? (
                        <ul className="list-disc ml-6">
                          {value.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        typeof value === 'object' && value !== null ? (
                          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          ` ${value}`
                        )
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
