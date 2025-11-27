import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import TripList from './TripList';
import TripFormModal from './TripFormModal';
import ProfileModal from './ProfileModal';
import "../styles/Dashboard.css";


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  
  // Tab state - NEW
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'requests'
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Modal states
  const [showTripForm, setShowTripForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Trip form states
  const [editTripId, setEditTripId] = useState(null);
  const [tripForm, setTripForm] = useState({
    destination: '',
    budget: '',
    startDate: '',
    endDate: '',
    femaleAllowed: true,
    maleCount: 0,
    femaleCount: 0
  });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    age: '',
    gender: '',
    phoneNumber: '',
    college: '',
    course: '',
    graduationYear: '',
    location: '',
    bio: ''
  });

  // Location picker states
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Fetch data on mount and when tab changes - UPDATED
  useEffect(() => {
    fetchUserData();
    fetchProfile();
  }, []);

  // Fetch data based on active tab - NEW
  useEffect(() => {
    if (activeTab === 'upcoming') {
      fetchUpcomingTrips();
    } else if (activeTab === 'past') {
      fetchPastTrips();
    } else if (activeTab === 'requests') {
      fetchPendingRequests();
    }
  }, [activeTab]);

  const fetchUserData = () => {
    axios.get('http://localhost:8080/api/user', { withCredentials: true })
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        window.location.href = '/';
      });
  };

  // NEW - Fetch upcoming trips
  const fetchUpcomingTrips = () => {
    axios.get('http://localhost:8080/api/trips/upcoming', { withCredentials: true })
      .then(res => setTrips(res.data))
      .catch(err => console.error('Error fetching upcoming trips:', err));
  };

  // NEW - Fetch past trips
  const fetchPastTrips = () => {
    axios.get('http://localhost:8080/api/trips/past', { withCredentials: true })
      .then(res => setTrips(res.data))
      .catch(err => console.error('Error fetching past trips:', err));
  };

  // NEW - Fetch pending requests
  const fetchPendingRequests = () => {
    axios.get('http://localhost:8080/api/trips/requests/pending', { withCredentials: true })
      .then(res => setPendingRequests(res.data))
      .catch(err => console.error('Error fetching requests:', err));
  };

  // DEPRECATED - Keep for backward compatibility with "My Trips"
  const fetchTrips = () => {
    axios.get('http://localhost:8080/api/trips/my', { withCredentials: true })
      .then(res => setTrips(res.data))
      .catch(err => console.error('Error fetching trips:', err));
  };

  const fetchProfile = () => {
    axios.get('http://localhost:8080/api/user/profile', { withCredentials: true })
      .then(res => {
        setProfile(res.data);
        setProfileForm({
          age: res.data.age || '',
          gender: res.data.gender || '',
          phoneNumber: res.data.phoneNumber || '',
          college: res.data.college || '',
          course: res.data.course || '',
          graduationYear: res.data.graduationYear || '',
          location: res.data.location || '',
          bio: res.data.bio || ''
        });
      })
      .catch(err => console.error('Error fetching profile:', err));
  };

  // Handlers
  const handleLogout = () => {
    axios.post('http://localhost:8080/logout', {}, { withCredentials: true })
      .then(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      })
      .catch(() => window.location.href = '/');
  };

  const handleTripFormChange = e => {
    const { name, value, type, checked } = e.target;
    setTripForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProfileFormChange = e => {
    const { name, value } = e.target;
    setProfileForm(f => ({ ...f, [name]: value }));
  };

  const calculateDays = () => {
    if (tripForm.startDate && tripForm.endDate) {
      const start = new Date(tripForm.startDate);
      const end = new Date(tripForm.endDate);
      return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    }
    return 0;
  };

  const handleCreateOrUpdateTrip = e => {
    e.preventDefault();
    
    if (tripForm.maleCount < 0 || tripForm.femaleCount < 0) {
      alert('Counts cannot be negative');
      return;
    }

    const url = editTripId 
      ? `http://localhost:8080/api/trips/${editTripId}/update`
      : 'http://localhost:8080/api/trips/create';
    
    const method = editTripId ? axios.put : axios.post;

    method(url, tripForm, { withCredentials: true })
      .then(() => {
        setShowTripForm(false);
        setEditTripId(null);
        // Refresh current tab data
        if (activeTab === 'upcoming') fetchUpcomingTrips();
        else if (activeTab === 'past') fetchPastTrips();
        resetTripForm();
      })
      .catch(() => alert('Error saving trip'));
  };

  const handleEditTrip = trip => {
    setEditTripId(trip.id);
    setTripForm({
      destination: trip.destination || '',
      budget: trip.budget || '',
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      femaleAllowed: trip.femaleAllowed ?? true,
      maleCount: trip.maleCount || 0,
      femaleCount: trip.femaleCount || 0
    });
    setShowTripForm(true);
  };

  // NEW - Handle join request
  const handleRequestToJoin = (tripId) => {
    axios.post(`http://localhost:8080/api/trips/${tripId}/request`, {}, { withCredentials: true })
      .then(() => {
        alert('Request sent successfully!');
        fetchUpcomingTrips(); // Refresh to update button state
      })
      .catch(err => {
        const message = err.response?.data?.message || 'Error sending request';
        alert(message);
      });
  };

  // NEW - Approve request
  const handleApproveRequest = (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    
    axios.post(`http://localhost:8080/api/trips/requests/${requestId}/approve`, {}, { withCredentials: true })
      .then(() => {
        alert('Request approved successfully!');
        fetchPendingRequests();
      })
      .catch(err => {
        const message = err.response?.data?.message || 'Error approving request';
        alert(message);
      });
  };

  // NEW - Deny request
  const handleDenyRequest = (requestId) => {
    if (!window.confirm('Are you sure you want to deny this request?')) return;
    
    axios.post(`http://localhost:8080/api/trips/requests/${requestId}/deny`, {}, { withCredentials: true })
      .then(() => {
        alert('Request denied successfully!');
        fetchPendingRequests();
      })
      .catch(err => {
        const message = err.response?.data?.message || 'Error denying request';
        alert(message);
      });
  };

  const handleProfileSubmit = e => {
    e.preventDefault();
    axios.put('http://localhost:8080/api/user/profile', profileForm, { withCredentials: true })
      .then(res => {
        setProfile(res.data);
        setIsEditingProfile(false);
        setShowProfileModal(false);
        alert('Profile updated successfully!');
      })
      .catch(() => alert('Failed to update profile'));
  };

  // Google Maps logic
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window.google === 'object' && typeof window.google.maps === 'object') {
        return resolve(window.google);
      }
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      if (!apiKey) {
        return reject(new Error('Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in .env'));
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        resolve(window.google);
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  const openLocationPicker = async () => {
    try {
      await loadGoogleMapsScript();
      setShowLocationPicker(true);
      setTimeout(() => {
        if (window.google && document.getElementById('profile-map')) {
          const map = new window.google.maps.Map(document.getElementById('profile-map'), {
            center: { lat: 22.5600, lng: 88.3700 },
            zoom: 6
          });
          const geocoder = new window.google.maps.Geocoder();
          let marker = null;
          map.addListener('click', (e) => {
            const latlng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            if (marker) marker.setMap(null);
            marker = new window.google.maps.Marker({ position: latlng, map });
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setProfileForm(f => ({ ...f, location: results[0].formatted_address }));
              }
            });
          });
          if (profileForm.location) {
            geocoder.geocode({ address: profileForm.location }, (results, status) => {
              if (status === 'OK' && results[0]) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(12);
                marker = new window.google.maps.Marker({ position: results[0].geometry.location, map });
              }
            });
          }
        }
      }, 200);
    } catch (err) {
      console.error('Failed to load Google Maps', err);
      alert('Failed to load Google Maps. Make sure VITE_GOOGLE_MAPS_API_KEY is set.');
    }
  };

  const closeLocationPicker = () => {
    setShowLocationPicker(false);
  };

  const useMyLocation = async () => {
    try {
      await loadGoogleMapsScript();
      if (!navigator.geolocation) {
        alert('Geolocation not supported by your browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setProfileForm(f => ({ ...f, location: results[0].formatted_address }));
            alert('Location set to: ' + results[0].formatted_address);
          } else {
            alert('Could not determine address for your location');
          }
        });
      }, (err) => {
        console.error(err);
        alert('Unable to retrieve your location');
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load Google Maps API. Add VITE_GOOGLE_MAPS_API_KEY in .env');
    }
  };

  const resetTripForm = () => {
    setTripForm({
      destination: '',
      budget: '',
      startDate: '',
      endDate: '',
      femaleAllowed: true,
      maleCount: 0,
      femaleCount: 0
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        <DashboardHeader
          user={user}
          onLogout={handleLogout}
          onProfileClick={() => {
            setShowProfileModal(true);
            setIsEditingProfile(false);
          }}
        />

        <button 
          className="create-trip-btn"
          onClick={() => {
            setShowTripForm(true);
            setEditTripId(null);
            resetTripForm();
          }}
        >
          ✈️ Create New Trip
        </button>

        {/* NEW - Tab Navigation */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            🌍 Upcoming Trips
          </button>
          <button 
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            📅 My Past Trips
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            📬 Pending Requests
            {pendingRequests.length > 0 && (
              <span className="badge">{pendingRequests.length}</span>
            )}
          </button>
        </div>

        {/* NEW - Conditional Content Based on Active Tab */}
        {activeTab === 'requests' ? (
          <div className="requests-container">
            {pendingRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending requests</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="request-card">
                  <div className="request-header">
                    <img 
                      src={req.userPicture || 'https://via.placeholder.com/50'} 
                      alt={req.userName}
                      className="request-avatar"
                    />
                    <div className="request-info">
                      <h3>{req.userName}</h3>
                      <p className="request-email">{req.userEmail}</p>
                    </div>
                  </div>
                  <div className="request-trip-info">
                    <p><strong>Trip:</strong> {req.destination}</p>
                    <p><strong>Dates:</strong> {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                    <p className="request-time">
                      Requested: {new Date(req.requestedAt).toLocaleDateString()} at {new Date(req.requestedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => handleApproveRequest(req.id)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="deny-btn"
                      onClick={() => handleDenyRequest(req.id)}
                    >
                      ❌ Deny
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <TripList 
            trips={trips} 
            onEdit={handleEditTrip}
            onRequestJoin={handleRequestToJoin}
            currentUserId={user?.id}
            showJoinButton={activeTab === 'upcoming'}
          />
        )}

        {showTripForm && (
          <TripFormModal
            isEdit={!!editTripId}
            form={tripForm}
            onChange={handleTripFormChange}
            onSubmit={handleCreateOrUpdateTrip}
            onCancel={() => {
              setShowTripForm(false);
              setEditTripId(null);
              resetTripForm();
            }}
            calculateDays={calculateDays}
          />
        )}

        {showProfileModal && (
          <ProfileModal
            user={user}
            profile={profile}
            profileForm={profileForm}
            isEditing={isEditingProfile}
            onChange={handleProfileFormChange}
            onSubmit={handleProfileSubmit}
            onEdit={() => setIsEditingProfile(true)}
            onClose={() => {
              setShowProfileModal(false);
              setIsEditingProfile(false);
            }}
            openLocationPicker={openLocationPicker}
            useMyLocation={useMyLocation}
          />
        )}

        {/* Location Picker Modal */}
        {showLocationPicker && (
          <div className="modal-overlay">
            <div className="modal-content profile-modal-content">
              <h2>Select Location</h2>
              <div id="profile-map" style={{ width: '100%', height: '400px', marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={closeLocationPicker}>Set Location</button>
                <button type="button" onClick={() => { setProfileForm(f => ({ ...f, location: '' })); closeLocationPicker(); }}>Clear</button>
                <button type="button" onClick={closeLocationPicker}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
