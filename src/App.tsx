import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Calendar, Users, PenTool as Tool, User, Bell, HelpCircle, RefreshCw, Wifi, WifiOff, Database } from 'lucide-react';
import EventCard from './components/EventCard';
import PopularEventCard from './components/PopularEventCard';
import Navbar from './components/Navbar';
import Speakers from './pages/Speakers';
import SpeakerDetail from './pages/SpeakerDetail';
import SpeakersList from './pages/SpeakersList';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import AllEvents from './pages/AllEvents';
import Tools from './pages/Tools';
import Profile from './pages/Profile';
import Home from './pages/Home';
import CheckEndpoint from './pages/CheckEndpoint';
import Participants from './pages/Participants';
import ParticipantDetail from './pages/ParticipantDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/speakers" 
            element={
              <ProtectedRoute>
                <Speakers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/speakers/list" 
            element={
              <ProtectedRoute>
                <SpeakersList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/speaker/:id" 
            element={
              <ProtectedRoute>
                <SpeakerDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participants" 
            element={
              <ProtectedRoute>
                <Participants />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/:id" 
            element={
              <ProtectedRoute>
                <ParticipantDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/event/:id" 
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/all-events" 
            element={
              <ProtectedRoute>
                <AllEvents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tools" 
            element={
              <ProtectedRoute>
                <Tools />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/check-endpoint" 
            element={
              <ProtectedRoute>
                <CheckEndpoint />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App