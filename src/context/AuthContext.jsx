import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cz_hub_token'));
  const [hubId, setHubId] = useState(null);
  const [hubName, setHubName] = useState('');
  const [serviceablePincodes, setServiceablePincodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }
      
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userData = response.data.user || response.data;
        setUser(userData);
        setIsAuthenticated(true);
        
        if (userData.hubId) {
          setHubId(userData.hubId._id || userData.hubId);
          setHubName(userData.hubId.name || 'Unknown Hub');
          setServiceablePincodes(userData.hubId.serviceablePincodes || []);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('cz_hub_token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    if (userData.hubId) {
      setHubId(userData.hubId._id || userData.hubId);
      setHubName(userData.hubId.name || 'Unknown Hub');
      setServiceablePincodes(userData.hubId.serviceablePincodes || []);
    }
  };

  const logout = () => {
    localStorage.removeItem('cz_hub_token');
    setToken(null);
    setUser(null);
    setHubId(null);
    setHubName('');
    setServiceablePincodes([]);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      hubId,
      hubName,
      serviceablePincodes,
      isLoading,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
