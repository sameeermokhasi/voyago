import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import { websocketService } from './services/websocket'

// Components
import Navbar from './components/Navbar'

// Pages

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import OTPInput from './pages/OTPInput'
import ChatNotification from './components/ChatNotification'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'


import RiderDashboard from './pages/RiderDashboard'
import DriverDashboard from './pages/DriverDashboard'
import AdminDashboard from './pages/AdminDashboard'
import IntercityRides from './pages/IntercityRides'
import VacationBooking from './pages/VacationBooking'
import BookRide from './pages/BookRide'
import DriverVacationManagement from './pages/DriverVacationManagement'
import VacationSchedulePlanner from './components/VacationSchedulePlanner'
import FixedPackages from './pages/FixedPackages'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import RideHistory from './pages/RideHistory'
import DriverMessages from './pages/DriverMessages'
import RiderMessages from './pages/RiderMessages'
import TermsPage from './pages/TermsPage'
import PolicyPage from './pages/PolicyPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, role } = useAuthStore()

  // Debug logging
  console.log('ProtectedRoute check:', { isAuthenticated, user, role, allowedRoles })

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Determine effective role: User's actual role if logged in, otherwise Port role
  const effectiveRole = user ? user.role : role

  // Check if the effective role matches allowed roles
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    console.log('Role not allowed, redirecting to home')
    return <Navigate to="/" replace />
  }

  // Port Logic: Only enforce strict port-role mismatch in DEV environment (Ports 6001/7001)
  // In Prod (default port), we allow any role.
  const isDevPort = window.location.port === '6001' || window.location.port === '7001';
  if (isDevPort && user && user.role !== role) {
    console.log('Dev Port Mismatch: User role does not match port, logging out')
    const { logout } = useAuthStore.getState()
    logout()
    return <Navigate to="/login" replace />
  }

  console.log('Rendering protected route content')
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

function App() {
  const { isAuthenticated, user, role } = useAuthStore()

  // Debug logging
  console.log('App render:', { isAuthenticated, user, role })

  // Initialize auth from storage and connect to WebSocket on app load
  // Initialize auth from storage on app load
  useEffect(() => {
    useAuthStore.getState().initFromStorage()
  }, [])

  // Global Chat Notification State
  const [chatNotification, setChatNotification] = useState(null);
  const navigate = useNavigate(); // For redirecting on click

  // Connect to WebSocket & Listen for Messages
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, connecting to WebSocket...');
      websocketService.connect();

      // Listen for incoming messages
      const handleNewMessage = (data) => {
        // Only show if it matches a message type
        if (data.type === 'personal_message' || data.type === 'new_message') {
          setChatNotification({
            sender: data.sender_name || 'Voyago User',
            content: data.content || 'You have a new message',
            ...data
          });
        }
      };

      websocketService.addListener('message', handleNewMessage);

      // Cleanup listener (but keep connection if still auth)
      return () => {
        websocketService.removeListener('message', handleNewMessage);
      };

    } else {
      websocketService.disconnect();
    }
  }, [isAuthenticated]);

  const handleNotificationClick = () => {
    setChatNotification(null);
    if (role === 'rider') navigate('/rider/messages');
    else if (role === 'driver') navigate('/driver/messages');
    else if (role === 'admin') navigate('/admin/messages'); // Assuming admin has messages
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={
          isAuthenticated ? (
            role === 'rider' ? <Navigate to="/rider" replace /> :
              role === 'driver' ? <Navigate to="/driver" replace /> :
                role === 'admin' ? <Navigate to="/admin" replace /> :
                  <Landing />
          ) : <Landing />
        } />

        <Route path="/login" element={
          isAuthenticated ? (
            // Redirect to appropriate dashboard based on role
            role === 'rider' ? <Navigate to="/rider" replace /> :
              role === 'driver' ? <Navigate to="/driver" replace /> :
                role === 'admin' ? <Navigate to="/admin" replace /> :
                  <Navigate to="/" replace />
          ) : <Login />
        } />

        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />

        <Route path="/verify-otp" element={<OTPInput />} />

        <Route path="/terms" element={<TermsPage />} />
        <Route path="/policy" element={<PolicyPage />} />

        <Route path="/rider/*" element={
          <ProtectedRoute allowedRoles={['rider']}>
            <Routes>
              <Route index element={<RiderDashboard />} />
              <Route path="book" element={<BookRide />} />
              <Route path="vacation-booking" element={<VacationBooking />} />
              <Route path="vacation-planner" element={<VacationSchedulePlanner />} />
              <Route path="fixed-packages" element={<FixedPackages />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<RideHistory />} />
              <Route path="messages" element={<RiderMessages />} />
            </Routes>
          </ProtectedRoute>
        } />

        <Route path="/driver/*" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <Routes>
              <Route index element={<DriverDashboard />} />
              <Route path="vacations" element={<DriverVacationManagement />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<RideHistory />} />
              <Route path="messages" element={<DriverMessages />} />
            </Routes>
          </ProtectedRoute>
        } />

        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/intercity" element={
          <ProtectedRoute>
            <IntercityRides />
          </ProtectedRoute>
        } />

        <Route path="/vacation" element={
          <ProtectedRoute allowedRoles={['rider']}>
            <VacationBooking />
          </ProtectedRoute>
        } />
      </Routes>

      {/* Global Notification Overlay */}
      <ChatNotification
        notification={chatNotification}
        onClose={() => setChatNotification(null)}
        onClick={handleNotificationClick}
      />
    </div>
  )
}

export default App