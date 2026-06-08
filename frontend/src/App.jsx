import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

import './index.css';
import ObstacleDetector from './ObstacleDetector';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom icon for the user's live location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function App() {
  const [accessibleMode, setAccessibleMode] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);
  
  const [startLoc, setStartLoc] = useState('Main Gate');
  const [endLoc, setEndLoc] = useState('Library');
  const [routePath, setRoutePath] = useState([]);
  const [routeNodes, setRouteNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Real-time tracking state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Mock coordinates for FCRIT Vashi
  const coordinates = {
    'Main Gate': [19.07510, 72.99150],
    'Administrative Block': [19.07530, 72.99150],
    'Library': [19.07550, 72.99140],
    'Engineering Block': [19.07560, 72.99160],
    'Canteen': [19.07540, 72.99170],
    'Sports Ground': [19.07580, 72.99120],
  };

  const fetchRoute = async () => {
    setLoading(true);
    // Reset simulation
    setIsSimulating(false);
    setCurrentLocation(null);
    
    try {
      const response = await axios.get('http://localhost:5000/api/routes', {
        params: {
          start: startLoc,
          end: endLoc,
          accessibilityNeeds: accessibleMode
        }
      });
      
      if (response.data.status === 'success') {
        const pathCoords = response.data.path.map(node => coordinates[node]);
        setRoutePath(pathCoords);
        setRouteNodes(response.data.path);
        // Set initial user location to start point
        setCurrentLocation(pathCoords[0]);
      } else {
        alert("No route found!");
        setRoutePath([]);
        setRouteNodes([]);
      }
    } catch (error) {
      console.error("Error fetching route", error);
      alert("Error connecting to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [accessibleMode]);

  const handleObstacle = (message) => {
    if (activeAlert !== message) {
      setActiveAlert(message);
      setTimeout(() => setActiveAlert(null), 3000);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const speakDirections = () => {
    if ('speechSynthesis' in window && routeNodes.length > 0) {
      const text = `Navigating from ${startLoc} to ${endLoc}. Directions are: ` + 
                   routeNodes.join(' to ');
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Simulate Walk function
  const simulateWalk = () => {
    if (routePath.length < 2) return;
    setIsSimulating(true);
    
    let step = 0;
    const totalSteps = 100;
    let nodeIndex = 0;
    
    const animate = () => {
      if (nodeIndex >= routePath.length - 1) {
        setIsSimulating(false);
        return; // Reached destination
      }
      
      const startCoord = routePath[nodeIndex];
      const endCoord = routePath[nodeIndex + 1];
      
      const lat = startCoord[0] + (endCoord[0] - startCoord[0]) * (step / totalSteps);
      const lng = startCoord[1] + (endCoord[1] - startCoord[1]) * (step / totalSteps);
      
      setCurrentLocation([lat, lng]);
      
      step++;
      if (step > totalSteps) {
        step = 0;
        nodeIndex++;
      }
      
      if (isSimulating) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header className="glass-panel flex-between" style={{ padding: '1rem 2rem', margin: '1rem', zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>CampusNav AI</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Intelligent & Accessible Routing</p>
        </div>
        <div className="flex-center" style={{ gap: '1rem' }}>
          <button 
            className={`btn-primary ${accessibleMode ? 'btn-accent' : ''}`}
            onClick={() => setAccessibleMode(!accessibleMode)}
            aria-pressed={accessibleMode}
          >
            {accessibleMode ? '♿ Accessible Route: ON' : '🚶 Standard Route'}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', gap: '1rem', padding: '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        
        <aside className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 10, overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Where to?</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="start-location" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Start Location</label>
              <select 
                id="start-location" 
                value={startLoc}
                onChange={(e) => setStartLoc(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--surface-hover)' }}
              >
                <option value="Main Gate">Main Gate</option>
                <option value="Administrative Block">Administrative Block</option>
                <option value="Library">Library</option>
                <option value="Engineering Block">Engineering Block</option>
                <option value="Canteen">Canteen</option>
                <option value="Sports Ground">Sports Ground</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="end-location" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Destination</label>
              <select 
                id="end-location" 
                value={endLoc}
                onChange={(e) => setEndLoc(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--surface-hover)' }}
              >
                <option value="Main Gate">Main Gate</option>
                <option value="Administrative Block">Administrative Block</option>
                <option value="Library">Library</option>
                <option value="Engineering Block">Engineering Block</option>
                <option value="Canteen">Canteen</option>
                <option value="Sports Ground">Sports Ground</option>
              </select>
            </div>
            
            <button 
              className="btn-primary" 
              onClick={fetchRoute}
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Calculating...' : 'Start Navigation'}
            </button>
            
            {routePath.length > 0 && (
               <button 
                className="btn-primary" 
                onClick={simulateWalk}
                disabled={isSimulating}
                style={{ padding: '0.75rem', backgroundColor: isSimulating ? 'var(--surface-hover)' : 'var(--accent-color)', opacity: isSimulating ? 0.5 : 1 }}
              >
                {isSimulating ? 'Walking...' : '▶ Simulate Real-Time Walk'}
              </button>
            )}
          </div>

          {routeNodes.length > 0 && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius-sm)' }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Directions</h3>
                <button onClick={speakDirections} style={{ background: 'none', color: 'var(--primary-color)', fontSize: '1.2rem' }}>
                  🔊
                </button>
              </div>
              <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', margin: 0 }}>
                {routeNodes.map((node, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    {i === 0 ? `Start at ${node}` : 
                     i === routeNodes.length - 1 ? `Arrive at ${node}` : 
                     `Proceed to ${node}`}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <ObstacleDetector onObstacleDetected={handleObstacle} />

        </aside>

        <section className="glass-panel map-container" style={{ padding: 0 }}>
          {activeAlert && (
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '80%' }}>
              <div className="obstacle-alert">
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <strong>{activeAlert}</strong>
              </div>
            </div>
          )}
          
          <MapContainer 
            center={[19.075551, 72.991490]} 
            zoom={18} 
            style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {routePath.length > 0 && (
              <>
                <Polyline positions={routePath} color={accessibleMode ? '#10B981' : '#4F46E5'} weight={6} opacity={0.8} />
                <Marker position={routePath[0]}>
                  <Popup>Start: {startLoc}</Popup>
                </Marker>
                <Marker position={routePath[routePath.length - 1]}>
                  <Popup>End: {endLoc}</Popup>
                </Marker>
              </>
            )}
            
            {/* Live Location Marker */}
            {currentLocation && (
              <Marker position={currentLocation} icon={userIcon} zIndexOffset={1000}>
                <Popup>You are here!</Popup>
              </Marker>
            )}
          </MapContainer>
        </section>

      </main>
    </div>
  );
}

export default App;
