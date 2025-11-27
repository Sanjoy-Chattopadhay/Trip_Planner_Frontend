import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/TripList.css";

export default function TripList({ trips, onEdit, onRequestJoin, currentUserId, showJoinButton }) {
  const navigate = useNavigate();

  const calculateDays = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return 0;
  };

  const getStatusClass = (status) => {
    const baseClass = 'trip-status';
    if (status === 'Pending') return `${baseClass} status-pending`;
    if (status === 'Approved') return `${baseClass} status-approved`;
    if (status === 'Denied') return `${baseClass} status-denied`;
    return baseClass;
  };

  const isCreator = (trip) => {
    return trip.creator && trip.creator.id === currentUserId;
  };

  return (
    <div className="trip-list">
      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✈️</div>
          <p>Create your first trip to get started!</p>
        </div>
      ) : (
        trips.map((trip) => (
          <div key={trip.id} className="trip-card">
            <div className="trip-header">
              <h3>{trip.destination}</h3>
              {trip.status && (
                <span className={getStatusClass(trip.status)}>
                  {trip.status}
                </span>
              )}
            </div>

            <div className="trip-details">
              <div className="detail-row">
                <span className="label">📅 Dates:</span>
                <span>
                  {new Date(trip.startDate).toLocaleDateString()} - 
                  {new Date(trip.endDate).toLocaleDateString()}
                  <span className="days-badge">
                    {calculateDays(trip.startDate, trip.endDate)} days
                  </span>
                </span>
              </div>

              <div className="detail-row">
                <span className="label">💰 Budget:</span>
                <span>₹{trip.budget}</span>
              </div>

              <div className="detail-row">
                <span className="label">👥 Group:</span>
                <span>
                  {trip.maleCount} Male{trip.maleCount !== 1 ? 's' : ''}, 
                  {trip.femaleCount} Female{trip.femaleCount !== 1 ? 's' : ''}
                </span>
              </div>

              {trip.creator && (
                <div className="detail-row">
                  <span className="label">👤 Created by:</span>
                  <span>{trip.creator.name}</span>
                </div>
              )}
            </div>

            <div className="trip-actions">
              <button
                className="view-btn"
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                View Details
              </button>

              {/* Show Edit button only for creator */}
              {isCreator(trip) && (
                <button
                  className="edit-btn"
                  onClick={() => onEdit(trip)}
                >
                  Edit Trip
                </button>
              )}

              {/* Show Request to Join button for non-creators in upcoming trips */}
              {showJoinButton && !isCreator(trip) && onRequestJoin && (
                <button
                  className="join-btn"
                  onClick={() => onRequestJoin(trip.id)}
                >
                  Request to Join
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
