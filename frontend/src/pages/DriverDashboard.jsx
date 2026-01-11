import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, MapPin, Navigation, Phone, Star, User, DollarSign,
  Clock, Calendar, Shield, Bell, Menu, X, CheckCircle, XCircle,
  ChevronRight, Car, Power, AlertCircle, Plane, MessageCircle
} from 'lucide-react'
import { rideService, userService, vacationService, messageService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import ChatWindow from '../components/ChatWindow'
import AIChatbot from '../components/AIChatbot'
import { websocketService } from '../services/websocket'
// Add map imports
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import DriverOnboardingModal from '../components/DriverOnboardingModal'

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function DriverDashboard() {
  console.log("DriverDashboard rendering...");
  const [localRides, setLocalRides] = useState([])
  const [vacationRides, setVacationRides] = useState([])
  const [myRides, setMyRides] = useState([])
  const [myVacations, setMyVacations] = useState([]) // Add myVacations state
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const isSimulatingRef = useRef(false) // Ref to track simulation status
  const [driverLocation, setDriverLocation] = useState(null) // Add driver location state
  const [selectedRide, setSelectedRide] = useState(null) // Add selected ride state
  const [showWallet, setShowWallet] = useState(false) // Add wallet visibility state
  const [transactions, setTransactions] = useState([]) // Add transactions state
  const [activeChat, setActiveChat] = useState(null)
  const [conversations, setConversations] = useState([])
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const mapRef = useRef(null)



  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await messageService.getRecentConversations()
        setConversations(data)
      } catch (e) {
        console.error("Failed to load conversations", e)
      }
    }
    loadConversations()
    const interval = setInterval(loadConversations, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const handleOpenChat = (userId, name) => {
    setActiveChat({ userId, name })
  }

  // Set driver as available when component mounts and ensure location is set
  useEffect(() => {
    const initializeDriver = async () => {
      try {
        console.log("Initializing driver...");

        // Check if driver is already available from user profile
        if (user?.driver_profile?.is_available) {
          console.log("Driver is already available");
          setIsOnline(true);
        } else {
          console.log("Driver is offline");
          setIsOnline(false);
        }

        // Set driver location if geolocation is available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                // Only update location if we have a token
                if (useAuthStore.getState().token) {
                  await userService.updateDriverLocation(latitude, longitude);
                  console.log("Driver location updated:", latitude, longitude);
                }
                // Store driver location in state
                setDriverLocation({ lat: latitude, lng: longitude });
              } catch (error) {
                console.error("Failed to update driver location:", error);
              }
            },
            (error) => {
              console.warn('Failed to get location:', error);
              // Even if we can't get location, we'll still try to load rides
              // But show a warning to the user
              alert('Warning: Location access denied. You may not receive nearby ride requests.');
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        } else {
          console.warn('Geolocation not supported');
          alert('Warning: Geolocation not supported. You may not receive nearby ride requests.');
        }
      } catch (error) {
        console.error("Failed to initialize driver:", error);
        setIsOnline(false);
      }
    };

    if (user) {
      initializeDriver();
    }
  }, [user]);

  // Function to calculate route between driver and rider
  const calculateRouteToRider = async (ride) => {
    if (!driverLocation || !ride) return [];

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${ride.pickup_lng},${ride.pickup_lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        return coordinates;
      }
    } catch (error) {
      console.error('Failed to calculate route to rider:', error);
    }
    return [];
  };

  const loadRides = async (isBackground = false) => {
    try {
      if (!isBackground) console.log("=== LOADING RIDES (Robust Mode) ===");
      if (!isBackground) setLoading(true)

      const results = await Promise.allSettled([
        rideService.getAvailableRides(),
        vacationService.getAvailableVacations(),
        rideService.getRides(),
        vacationService.getVacations(),
        userService.getCurrentUser()
      ]);

      const [ridesRes, vacationsRes, myRidesRes, myVacationsRes, userRes] = results;

      // Handle Local Available Rides
      if (ridesRes.status === 'fulfilled') {
        setLocalRides(ridesRes.value || []);
      } else {
        console.error("Failed to load available rides:", ridesRes.reason);
        // Keep existing if background refresh, else set empty
        if (!isBackground) setLocalRides([]);
      }

      // Handle Available Vacations
      if (vacationsRes.status === 'fulfilled') {
        const vacs = Array.isArray(vacationsRes.value) ? vacationsRes.value : [];
        setVacationRides(vacs);
      } else {
        console.warn("Failed to load available vacations (non-critical):", vacationsRes.reason);
        if (!isBackground) setVacationRides([]);
      }

      // Handle My Active Rides
      if (myRidesRes.status === 'fulfilled') {
        const allMyRides = Array.isArray(myRidesRes.value) ? myRidesRes.value : [];
        const assigned = allMyRides.filter(ride => ride.driver_id === user?.id);
        setMyRides(assigned);
      } else {
        console.error("Failed to load my rides:", myRidesRes.reason);
      }

      // Handle My Vacations
      if (myVacationsRes.status === 'fulfilled') {
        const myVacs = Array.isArray(myVacationsRes.value) ? myVacationsRes.value : [];
        setMyVacations(myVacs);
      } else {
        console.warn("Failed to load my vacations:", myVacationsRes.reason);
      }

      // Handle User Profile Update
      if (userRes.status === 'fulfilled') {
        useAuthStore.getState().updateUser(userRes.value);
      } else {
        console.warn("Failed to refresh user profile:", userRes.reason);
      }

    } catch (error) {
      console.error("Critical error in loadRides wrapper:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await userService.getTransactions()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }

  useEffect(() => {
    if (showWallet) {
      loadTransactions()
    }
  }, [showWallet])



  useEffect(() => {
    loadRides()
    // Auto-refresh every 5 seconds for real-time updates (only when online)
    const interval = setInterval(() => {
      if (isOnline && !activeChat) {
        loadRides(true)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isOnline, activeChat])

  // Watch for location changes when online and set initial location
  useEffect(() => {
    let locationWatchId = null

    const updateLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              // CHECK: If a ride is actively being simulated, DO NOT overwrite with real GPS
              // We check if there's any ride in 'in_progress' state in myRides
              // Note: We need access to the latest state of myRides here. 
              // Since this is inside a closure, we might need to rely on a ref or check just before calling update.
              // For simplicity, let's assume if we are online and have a ride, we prioritize simulation.

              // Only update real location if NO ride is in progress (Simulation Mode)
              const hasActiveRide = useAuthStore.getState().user?.driver_profile?.is_available &&
                document.querySelector('.border-l-4.border-blue-500'); // Hacky check for active card in UI, or better:

              // Ideally we'd check myRides state, but it's not in dependency array to avoid re-running interval.
              // Let's rely on the simulation interval to win the race or just disable this.

              // BETTER FIX: Let's simply NOT update location from here if we are "Online" 
              // because the simulation loop handles it when active, 
              // and if inactive, this loop handles it.

              // Actually, simpler approach for Demo:
              // If we are simulating (which we know we are if there's a ride), checking myRides is best.
              // But we can't easily access 'myRides' inside this closure without adding it to deps (restarting interval).

              // Alternative: Just update if we are clearly NOT verifying a ride.
              // Let's just comment out the real GPS update for this Demo session as requested by user?
              // No, let's do it properly. I'll add myRides to dependency and handle it.

              // Only update real location if NOT simulating
              if (!isSimulatingRef.current) {
                await userService.updateDriverLocation(latitude, longitude)
                console.log("Driver location updated (Real GPS):", latitude, longitude)
                setDriverLocation({ lat: latitude, lng: longitude })
              } else {
                console.log("Skipping Real GPS update (Simulation Active)");
              }
            },
            (error) => {
              console.warn('Failed to get location:', error)
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          )
        }
      } catch (error) {
        console.error('Failed to update driver location:', error)
      }
    }

    if (isOnline && navigator.geolocation) {
      // Set initial location immediately
      updateLocation()

      // Update location every 10 seconds when online
      locationWatchId = setInterval(updateLocation, 10000)
    }

    return () => {
      if (locationWatchId) {
        clearInterval(locationWatchId)
      }
    }
  }, [isOnline])

  // SIMULATION: Simulate movement when ride is in progress (for demo purposes)
  useEffect(() => {
    let simulationInterval = null;
    const activeRide = myRides.find(r => r.status === 'in_progress');

    if (activeRide && isOnline) {
      isSimulatingRef.current = true; // Block real GPS
      console.log("Starting ride simulation movement... (Blocking real GPS)", activeRide.id);

      let progress = 0;
      const steps = 100; // Total steps from A to B
      const startLat = parseFloat(activeRide.pickup_lat);
      const startLng = parseFloat(activeRide.pickup_lng);
      const endLat = parseFloat(activeRide.destination_lat);
      const endLng = parseFloat(activeRide.destination_lng);

      simulationInterval = setInterval(async () => {
        if (progress >= 1) {
          clearInterval(simulationInterval);
          isSimulatingRef.current = false;
          return;
        }

        // Interpolate position
        progress += 0.01; // Move 1% every 2 seconds
        const currentLat = startLat + (endLat - startLat) * progress;
        const currentLng = startLng + (endLng - startLng) * progress;

        // Update Backend
        try {
          await userService.updateDriverLocation(currentLat, currentLng);
          setDriverLocation({ lat: currentLat, lng: currentLng });
          // console.log(`Simulated Location: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
        } catch (e) {
          console.error("Simulation update failed", e);
        }

      }, 2000); // Update every 2 seconds
    } else {
      isSimulatingRef.current = false; // Allow real GPS if no active ride
    }

    return () => {
      if (simulationInterval) clearInterval(simulationInterval);
      isSimulatingRef.current = false;
    }
  }, [myRides, isOnline]);

  // Keep user ref updated for WebSocket callbacks
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // WebSocket connection for real-time ride requests
  useEffect(() => {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const reconnectInterval = 3000;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      // Clear any existing reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      // Get auth token from the correct storage key
      const storageKey = `auth-storage-driver`;
      // Use sessionStorage instead of localStorage
      let stored = sessionStorage.getItem(`${storageKey}-token`);
      let token = null;

      // Try multiple storage key patterns
      if (!stored) {
        stored = sessionStorage.getItem(`auth-storage-${user?.id}`);
      }

      if (!stored) {
        stored = sessionStorage.getItem(`auth-storage`);
      }

      if (stored) {
        try {
          // If it's JSON, parse it
          const parsed = JSON.parse(stored);
          token = parsed.state?.token || parsed.token || stored;
        } catch (e) {
          // If it's not JSON, use it directly
          token = stored;
        }
      }

      // Fallback: try to get token from auth store
      if (!token && useAuthStore.getState().token) {
        token = useAuthStore.getState().token;
      }

      // If we still don't have a token, check if we can find it in the user object
      if (!token && user?.token) {
        token = user.token;
      }

      if (!token) {
        console.error('No auth token found for WebSocket connection');
        // Try to reconnect after a delay
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            connectWebSocket();
          }, reconnectInterval);
        } else {
          console.error('Max reconnect attempts reached. Please refresh the page.');
          // alert('Connection failed. Please refresh the page to receive ride requests.'); // Removed blocking alert
        }
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        reconnectAttempts = 0; // Reset on successful connection
        // Show a success message to the driver
        console.log('WebSocket connection established. You will now receive ride requests.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("=== WEBSOCKET MESSAGE RECEIVED ===", data);
          if (data.type === 'new_ride_request') {
            const currentUser = userRef.current;
            // VEHICLE TYPE CHECK
            if (currentUser?.driver_profile?.vehicle_type) {
              const driverType = currentUser.driver_profile.vehicle_type.toLowerCase();
              const rideType = (data.vehicle_type || 'economy').toLowerCase();

              if (driverType !== rideType) {
                console.log(`Mismatch vehicle type: Ride is ${rideType}, Driver is ${driverType}. Ignoring.`);
                return;
              }

              // LOCATION/CITY CHECK (Token-Based Filtering) - Matches Backend Logic
              // Robust matching by checking if any significant part of the city name overlaps
              if (currentUser?.driver_profile?.city) {
                const driverCity = currentUser.driver_profile.city;
                const pickupAddress = data.pickup_address || '';

                // Helper to tokenize - Keep simple inside effect
                const getTokens = (text) => {
                  if (!text) return new Set();
                  return new Set(
                    text.toLowerCase()
                      .split(/[\s,-]+/)
                      .filter(w => w.length > 2) // Ignore short words
                  );
                };

                const driverTokens = getTokens(driverCity);
                const pickupTokens = getTokens(pickupAddress);

                // Check for overlap
                let hasOverlap = false;
                for (let token of driverTokens) {
                  if (pickupTokens.has(token)) {
                    hasOverlap = true;
                    break;
                  }
                }

                if (!hasOverlap) {
                  // console.log(`Mismatch location (Token): Ride is in '${pickupAddress}', Driver is in '${driverCity}'. Ignoring.`);
                  return;
                }
              }
            }

            console.log("Processing new ride request:", data);
            // Add new ride to available rides
            setLocalRides(prev => {
              // Check if ride already exists
              const exists = prev.some(ride => ride.id === data.ride_id);
              if (!exists) {
                console.log("Adding new ride to local rides list");
                return [
                  {
                    id: data.ride_id,
                    pickup_address: data.pickup_address,
                    destination_address: data.destination_address,
                    distance_km: data.distance_km,
                    estimated_fare: data.estimated_fare,
                    vehicle_type: data.vehicle_type
                  },
                  ...prev
                ];
              }
              console.log("Ride already exists in local rides list");
              return prev;
            });

            // Show notification
            if (Notification.permission === 'granted') {
              new Notification('New Ride Request', {
                body: `New ride request from ${data.pickup_address} to ${data.destination_address}`,
                icon: '/favicon.ico'
              });
            } else {
              // Fallback alert if notifications are blocked
              alert(`New ride request!\nFrom: ${data.pickup_address}\nTo: ${data.destination_address}\nFare: ₹${data.estimated_fare}`);
            }
          } else if (data.type === 'ride_taken') {
            console.log("Ride taken by another driver:", data.ride_id);
            setLocalRides(prev => prev.filter(ride => ride.id !== data.ride_id));
            setVacationRides(prev => prev.filter(ride => ride.id !== data.ride_id));
          } else if (data.type === 'new_vacation_request') {
            console.log("Processing new vacation request:", data);
            // Add new vacation to available rides
            setVacationRides(prev => {
              // Check if vacation already exists
              const exists = prev.some(vacation => vacation.id === data.vacation_id);
              if (!exists) {
                console.log("Adding new vacation to vacation rides list");
                return [
                  {
                    id: data.vacation_id,
                    destination: data.destination,
                    hotel_name: data.hotel_name,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    total_price: data.total_price,
                    passengers: data.passengers
                  },
                  ...prev
                ];
              }
              console.log("Vacation already exists in vacation rides list");
              return prev;
            });

            // Show notification
            if (Notification.permission === 'granted') {
              new Notification('New Vacation Request', {
                body: `New vacation request to ${data.destination}`,
                icon: '/favicon.ico'
              });
            } else {
              // Fallback alert if notifications are blocked
              alert(`New vacation request!\nDestination: ${data.destination}\nPrice: ₹${data.total_price}`);
            }
          } else if (data.type === 'ride_status_update') {
            console.log("Processing ride status update");
            // Refresh rides when status updates
            loadRides();
          } else if (data.type === 'vacation_status_update') {
            console.log("Processing vacation status update");
            // Refresh vacations when status updates
            loadRides();
          } else {
            // Handle any other message types by refreshing rides
            console.log("Unknown message type, refreshing rides");
            loadRides();
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          // Even if we can't parse the message, try to refresh rides
          loadRides();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // alert('Connection error. Attempting to reconnect...'); // Removed blocking alert
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        ws = null;
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            connectWebSocket();
          }, reconnectInterval);
        } else {
          console.error('Max reconnect attempts reached. Please refresh the page.');
          // alert('Connection lost. Please refresh the page to receive ride requests.'); // Removed blocking alert
        }
      };
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      });
    }

    // Only connect WebSocket when user is logged in and online
    if (user && isOnline) {
      // Connect to WebSocket
      connectWebSocket();
    }

    return () => {
      // Cleanup function
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [user?.id, isOnline]);

  // Add this useEffect to periodically fetch available rides as a fallback
  useEffect(() => {
    if (isOnline) {
      console.log("Setting up periodic ride refresh...");
      const interval = setInterval(() => {
        console.log("Periodically refreshing rides...");
        loadRides(true);
      }, 10000); // Fetch every 10 seconds as a fallback

      return () => {
        console.log("Clearing periodic ride refresh interval");
        clearInterval(interval);
      };
    }
  }, [isOnline]);



  // Map component to show rider location and route
  const RiderLocationMap = ({ ride, driverLoc }) => {
    const [route, setRoute] = useState([]);

    useEffect(() => {
      const fetchRoute = async () => {
        if (ride && driverLoc) {
          const routeCoords = await calculateRouteToRider(ride);
          setRoute(routeCoords);
        }
      };

      fetchRoute();
    }, [ride, driverLoc]);

    if (!ride || !driverLoc) return null;

    // Center the map between driver and rider
    const center = [
      (parseFloat(ride.pickup_lat) + parseFloat(driverLoc.lat)) / 2,
      (parseFloat(ride.pickup_lng) + parseFloat(driverLoc.lng)) / 2
    ];

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Rider Location Map</h3>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '400px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Rider pickup location */}
          <Marker position={[parseFloat(ride.pickup_lat), parseFloat(ride.pickup_lng)]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-green-600">📍 Rider Pickup</p>
                <p className="text-gray-600">{ride.pickup_address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Driver location */}
          <Marker position={[parseFloat(driverLoc.lat), parseFloat(driverLoc.lng)]} icon={driverIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-blue-600">🚗 Your Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Route between driver and rider */}
          {route.length > 0 && (
            <Polyline
              positions={route}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>

        <div className="mt-3 text-sm text-gray-600">
          <p>Click on markers to see details. Blue marker is your location, green marker is rider's pickup location.</p>
        </div>
      </div>
    );
  };

  const toggleOnlineStatus = async () => {
    console.log('=== TOGGLE ONLINE STATUS START ===')
    const newStatus = !isOnline
    console.log('New status:', newStatus)
    setIsOnline(newStatus)

    try {
      // Update driver availability in backend
      console.log('Toggling driver availability...')

      // Log the current user info
      console.log('Current user:', user)

      // Log the API call details
      const token = localStorage.getItem(`auth-storage-driver-token`)
      console.log('Auth token:', token ? 'Token exists' : 'No token found')
      console.log('All localStorage keys:', Object.keys(localStorage))

      const response = await userService.toggleDriverAvailability()
      console.log('Toggle response:', response)

      if (newStatus) {
        alert('You are now ONLINE! You will receive ride requests.')
        // Load rides immediately when going online
        loadRides()

        // Update user in store with new profile data
        if (response.driver_profile) {
          const { updateUser } = useAuthStore.getState();
          updateUser({ ...user, driver_profile: response.driver_profile });
        }

        // Request location permission and update location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              try {
                await userService.updateDriverLocation(latitude, longitude)
                console.log("Driver location updated:", latitude, longitude)
                // Store driver location in state
                setDriverLocation({ lat: latitude, lng: longitude })
              } catch (error) {
                console.error("Failed to update driver location:", error)
                alert('Failed to update your location. You may not receive nearby ride requests.')
              }
            },
            (error) => {
              console.warn('Failed to get initial location:', error)
              alert('Location access denied. You may not receive nearby ride requests.')
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          )
        } else {
          console.warn('Geolocation not supported')
          alert('Geolocation not supported. You may not receive nearby ride requests.')
        }
      } else {
        alert('You are now OFFLINE. You will not receive ride requests.')
        setLocalRides([])
        setVacationRides([])
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      })

      // Show more detailed error message
      let errorMessage = 'Failed to update availability status. Please try again.'
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.'
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Only drivers can update availability.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Driver profile not found.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }

      alert(errorMessage)
      setIsOnline(!newStatus) // Revert status on error
    }
    console.log('=== TOGGLE ONLINE STATUS END ===')
  }

  const acceptRide = async (rideId) => {
    try {
      console.log("Accepting ride:", rideId);
      const updatedRide = await rideService.updateRide(rideId, { status: 'accepted' });
      console.log("Ride accepted:", updatedRide);

      // Remove the ride from available rides
      setLocalRides(prev => prev.filter(ride => ride.id !== rideId));

      // Add to my rides
      setMyRides(prev => [...prev, updatedRide]);

      // Set the accepted ride as selected
      setSelectedRide(updatedRide);

      // Show success notification
      if (Notification.permission === 'granted') {
        new Notification('Ride Accepted', {
          body: `You have accepted the ride to ${updatedRide.destination_address}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error("Failed to accept ride:", error);
      // Show error notification
      if (Notification.permission === 'granted') {
        new Notification('Error Accepting Ride', {
          body: 'Failed to accept ride. Please try again.',
          icon: '/favicon.ico'
        });
      }
      alert(`Failed to accept ride: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    }
  };

  const startRide = async (rideId) => {
    try {
      console.log("Starting ride:", rideId);
      const updatedRide = await rideService.updateRide(rideId, { status: 'in_progress' });
      console.log("Ride started:", updatedRide);

      // Update the ride in my rides
      setMyRides(prev => prev.map(ride =>
        ride.id === rideId ? updatedRide : ride
      ));

      // Show success notification
      if (Notification.permission === 'granted') {
        new Notification('Ride Started', {
          body: `You have started the ride to ${updatedRide.destination_address}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error("Failed to start ride:", error);
      // Show error notification
      if (Notification.permission === 'granted') {
        new Notification('Error Starting Ride', {
          body: 'Failed to start ride. Please try again.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const completeRide = async (rideId) => {
    try {
      console.log("Completing ride:", rideId);
      const updatedRide = await rideService.updateRide(rideId, { status: 'completed' });
      console.log("Ride completed:", updatedRide);

      // Remove the ride from my rides
      setMyRides(prev => prev.filter(ride => ride.id !== rideId));

      // Clear selected ride if it was the completed ride
      if (selectedRide && selectedRide.id === rideId) {
        setSelectedRide(null);
      }

      // Show success notification
      if (Notification.permission === 'granted') {
        new Notification('Ride Completed', {
          body: `You have completed the ride to ${updatedRide.destination_address}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error("Failed to complete ride:", error);
      // Show error notification
      if (Notification.permission === 'granted') {
        new Notification('Error Completing Ride', {
          body: 'Failed to complete ride. Please try again.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Add the missing handler functions
  const handleAcceptRide = async (id, type) => {
    try {
      console.log(`Accepting ${type} ride:`, id);

      if (type === 'vacation') {
        // For vacation rides, we need to use vacationService
        console.log("Calling vacationService.confirmVacation with id:", id);
        const response = await vacationService.confirmVacation(id);
        console.log("Raw response from confirmVacation:", response);

        let updatedVacation = response.vacation;
        if (!updatedVacation && response.id) {
          // Fallback: maybe response is the vacation object itself
          updatedVacation = response;
        }

        if (!updatedVacation) {
          console.error("Could not parse vacation from response:", response);
          throw new Error("Invalid response from server");
        }

        console.log("Vacation accepted:", updatedVacation);

        // Remove from available vacation rides
        setVacationRides(prev => prev.filter(vacation => vacation.id !== id));

        // Add to my rides (we might need to adjust this based on how vacations are handled)
        // For now, we'll just refresh the data
        loadRides();

        // Show success notification
        if (Notification.permission === 'granted') {
          new Notification('Vacation Accepted', {
            body: `You have accepted the vacation to ${updatedVacation.destination}`,
            icon: '/favicon.ico'
          });
        }
        alert(`Successfully accepted vacation to ${updatedVacation.destination}`);
      } else {
        // For local rides, use the existing acceptRide function
        await acceptRide(id);

        // Find the accepted ride and set it as selected
        const acceptedRide = localRides.find(ride => ride.id === id);
        if (acceptedRide) {
          setSelectedRide(acceptedRide);
        }
      }
    } catch (error) {
      console.error(`Failed to accept ${type} ride:`, error);
      alert(`Failed to accept ${type} ride: ${error.message || error}`);
      // Show error notification
      if (Notification.permission === 'granted') {
        new Notification(`Error Accepting ${type === 'vacation' ? 'Vacation' : 'Ride'}`, {
          body: `Failed to accept ${type}. Please try again.`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleRejectRide = async (id, type) => {
    try {
      console.log(`Rejecting ${type} ride:`, id);

      if (type === 'vacation') {
        // For vacation rides, we need to cancel the vacation
        const updatedVacation = await vacationService.rejectVacation(id); // Changed to rejectVacation
        console.log("Vacation rejected:", updatedVacation);

        // Remove from available vacation rides
        setVacationRides(prev => prev.filter(vacation => vacation.id !== id));

        // Show success notification
        if (Notification.permission === 'granted') {
          new Notification('Vacation Rejected', {
            body: `You have rejected the vacation to ${updatedVacation.destination}`,
            icon: '/favicon.ico'
          });
        }
      } else {
        // For local rides, we need to cancel the ride
        await rideService.cancelRide(id);
        console.log("Ride rejected:", id);

        // Remove from available local rides
        setLocalRides(prev => prev.filter(ride => ride.id !== id));

        // Clear selected ride if it was the rejected ride
        if (selectedRide && selectedRide.id === id) {
          setSelectedRide(null);
        }

        // Show success notification
        if (Notification.permission === 'granted') {
          new Notification('Ride Rejected', {
            body: 'You have rejected the ride request',
            icon: '/favicon.ico'
          });
        }
      }
    } catch (error) {
      console.error(`Failed to reject ${type} ride:`, error);
      // Show error notification
      if (Notification.permission === 'granted') {
        new Notification(`Error Rejecting ${type === 'vacation' ? 'Vacation' : 'Ride'}`, {
          body: `Failed to reject ${type}. Please try again.`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleStartVacation = async (vacationId) => {
    try {
      if (!window.confirm('Are you sure you want to start this vacation travel?')) return;
      await vacationService.startVacation(vacationId);
      alert('Vacation travel started!');
      loadRides(); // Refresh to update status
    } catch (error) {
      console.error('Failed to start vacation:', error);
      alert('Failed to start vacation. Please try again.');
    }
  };

  const handleCompleteVacation = async (vacationId) => {
    try {
      if (!window.confirm('Are you sure you want to complete this vacation travel?')) return;
      await vacationService.completeVacation(vacationId);
      alert('Vacation travel completed!');
      loadRides(); // Refresh to update status
    } catch (error) {
      console.error('Failed to complete vacation:', error);
      alert('Failed to complete vacation. Please try again.');
    }
  };

  // Add useEffect to handle document visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isOnline) {
        // When tab becomes visible and driver is online, refresh rides
        loadRides();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black shadow-sm border-b border-dark-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Car className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-white">Driver Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Online/Offline Toggle */}
              <div className="flex items-center space-x-3 bg-dark-800 rounded-lg px-4 py-2 border border-dark-700">
                <button
                  onClick={loadRides}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-dark-600 transition-colors mr-2"
                  title="Refresh Rides"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-300">Status:</span>
                <button
                  onClick={toggleOnlineStatus}
                  className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none ${isOnline ? 'bg-primary-500' : 'bg-gray-400'
                    }`}
                >
                  <span
                    className={`inline-block w-6 h-6 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-9' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className={`text-sm font-bold ${isOnline ? 'text-primary-600' : 'text-gray-600'
                  }`}>
                  {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
                </span>
              </div>
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <button onClick={logout} className="btn-outline text-sm">
                <LogOut className="w-4 h-4 inline mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Online Status Alert */}
        {!isOnline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 mr-3" />
              <div>
                <p className="font-bold">You are currently OFFLINE</p>
                <p className="text-sm">Toggle the switch above to go online and start receiving ride requests.</p>
              </div>
            </div>
          </div>
        )}

        {isOnline && localRides.length === 0 && vacationRides.length === 0 && (
          <div className="bg-primary-100 border-l-4 border-primary-500 text-primary-800 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              <div>
                <p className="font-bold">You are ONLINE and ready for rides!</p>
                <p className="text-sm">New ride requests will appear automatically every 5 seconds.</p>
              </div>
            </div>
          </div>
        )}

        {/* Driver Stats Cards */}
        {isOnline && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Earnings Card */}
            <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                </div>
                <span className="bg-green-900/30 text-green-400 text-xs font-bold px-2 py-1 rounded-full">+12%</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">₹{user?.wallet_balance?.toFixed(2) || '0.00'}</h3>
              <p className="text-gray-400 text-sm">Today's Earnings</p>
            </div>

            {/* Trips Completed Card */}
            <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-900/30 rounded-lg">
                  <Car className="w-6 h-6 text-yellow-500" />
                </div>
                <span className="bg-green-900/30 text-green-400 text-xs font-bold px-2 py-1 rounded-full">+{myRides.filter(r => r.status === 'completed').length}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{user?.driver_profile?.total_rides || myRides.filter(r => r.status === 'completed').length}</h3>
              <p className="text-gray-400 text-sm">Trips Completed</p>
            </div>

            {/* Minutes Ridden Card */}
            <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {myRides.filter(r => r.status === 'completed').reduce((acc, ride) => acc + (ride.duration_minutes || 0), 0)}m
              </h3>
              <p className="text-gray-400 text-sm">Minutes Ridden</p>
            </div>

            {/* Rating Card */}
            <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-900/30 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <span className="bg-green-900/30 text-green-400 text-xs font-bold px-2 py-1 rounded-full">Live</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{user?.driver_profile?.rating?.toFixed(2) || '5.00'}</h3>
              <p className="text-gray-400 text-sm">Rating</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Section */}
          {showWallet && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">My Wallet</h2>
                <button
                  onClick={() => setShowWallet(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="card bg-gradient-to-br from-green-900 to-green-800 border-green-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-100">Current Balance</h3>
                    <DollarSign className="w-8 h-8 text-green-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">₹{user?.wallet_balance?.toFixed(2) || '0.00'}</p>
                </div>

                <div className="card bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-100">Total Earnings</h3>
                    <DollarSign className="w-8 h-8 text-blue-300" />
                  </div>
                  {/* Calculate total earnings from credit transactions */}
                  <p className="text-3xl font-bold text-white">
                    ₹{transactions
                      .filter(t => t.type === 'credit')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-bold mb-4">Transaction History</h3>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                            {transaction.type === 'credit' ? <DollarSign className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Rides Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🔔 New Local Ride Requests</h2>
              {isOnline && (
                <span className="text-sm text-primary-600 font-medium animate-pulse">● Auto-refreshing every 5s</span>
              )}
            </div>

            {!isOnline ? (
              <div className="text-center py-12 bg-dark-800 rounded-lg border border-dark-700">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">You are offline</p>
                <p className="text-sm text-gray-400 mt-2">Go online to receive ride requests</p>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : localRides.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No available local rides</p>
                <p className="text-sm text-gray-400 mt-2">New requests will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-4">
                {localRides.map((ride) => (
                  <div key={ride.id} className="border-2 border-yellow-500/50 bg-dark-800 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge badge-warning font-bold">⚡ NEW RIDE REQUEST</span>
                      <span className="text-sm text-gray-600 font-semibold">#{ride.id}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-start space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-gray-700">Pickup Location</p>
                          <p className="text-sm font-semibold">{ride.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-gray-700">Destination</p>
                          <p className="text-sm font-semibold">{ride.destination_address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-3 border-b">
                      <div className="text-sm text-gray-600">
                        <Navigation className="w-4 h-4 inline mr-1" />
                        {ride.distance_km?.toFixed(1) || 'N/A'} km
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Chat Button */}
                        <button
                          onClick={() => setActiveChat({ userId: ride.rider_id || 1, name: 'Rider' })} // Fix: Use userId with fallback
                          className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center transition-all"
                        >
                          <span className="mr-1">💬</span> Message
                        </button>

                        <div className="flex items-center">
                          <span className="text-lg font-bold text-primary-600 mr-1">₹</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {ride.estimated_fare?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Map Preview */}
                    <div className="h-48 mb-4 rounded-lg overflow-hidden border border-gray-200">
                      <MapContainer
                        center={[ride.pickup_lat || 12.9716, ride.pickup_lng || 77.5946]}
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                        dragging={false}
                        zoomControl={false}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {ride.pickup_lat && ride.pickup_lng && (
                          <Marker position={[ride.pickup_lat, ride.pickup_lng]} icon={pickupIcon} />
                        )}
                        {ride.destination_lat && ride.destination_lng && (
                          <Marker position={[ride.destination_lat, ride.destination_lng]} icon={destinationIcon} />
                        )}
                      </MapContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => acceptRide(ride.id)}
                        disabled={myRides.some(r => ['accepted', 'in_progress'].includes(r.status))}
                        className={`font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md ${myRides.some(r => ['accepted', 'in_progress'].includes(r.status))
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-primary-500 hover:bg-primary-600 text-black'
                          }`}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {myRides.some(r => ['accepted', 'in_progress'].includes(r.status))
                          ? 'BUSY (FINISH CURRENT RIDE)'
                          : 'ACCEPT RIDE'}
                      </button>
                      <button
                        onClick={() => handleRejectRide(ride.id, 'local')}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        REJECT
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>



          {/* My Active Rides */}
          <div>
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">🚗 My Active Rides</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : myRides.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active rides</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRides.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map((ride) => (
                    <div key={ride.id} className={`border-2 rounded-lg p-4 bg-dark-800 shadow-md ${ride.status === 'pending' ? 'border-yellow-500/50' :
                      ride.status === 'accepted' ? 'border-blue-500/50' :
                        ride.status === 'in_progress' ? 'border-purple-500/50' :
                          'border-gray-500'
                      }`}>
                      <div className="mb-3">
                        <div className="flex items-start space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-primary-600 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Pickup</p>
                            <p className="text-sm font-semibold">{ride.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-red-600 mt-1" />
                          <div>
                            <p className="font-medium text-sm">Drop-off</p>
                            <p className="text-sm font-semibold">{ride.destination_address}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${ride.status === 'accepted' ? 'badge-info' :
                            ride.status === 'in_progress' ? 'badge-warning' :
                              'badge-success'
                            }`}>
                            {ride.status === 'accepted' ? '✅ Accepted' :
                              ride.status === 'in_progress' ? '🚗 In Progress' :
                                ride.status === 'pending' ? '⏳ Pending Acceptance' :
                                  ride.status}
                          </span>
                          {/* Message Button */}
                          {(ride.status === 'accepted' || ride.status === 'in_progress') && (
                            <button
                              onClick={() => setActiveChat({ userId: ride.rider_id || 1, name: 'Rider' })}
                              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center transition-all ml-2"
                            >
                              <span className="mr-1">💬</span> Chat
                            </button>
                          )}
                        </div>
                        <span className="font-bold text-primary-600 text-lg">
                          ₹{ride.estimated_fare?.toFixed(2)}
                        </span>
                      </div>
                      {/* Progress indicator for active rides */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Accepted</span>
                          <span>In Progress</span>
                          <span>Completed</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all duration-1000 ${ride.status === 'accepted' ? 'bg-blue-500 w-1/2' :
                            ride.status === 'in_progress' ? 'bg-purple-500 w-3/4' :
                              ride.status === 'pending' ? 'bg-yellow-500 w-1/4' :
                                'bg-primary-500 w-full'
                            }`}></div>
                        </div>
                      </div>
                      {/* Stage-specific buttons with enhanced visibility */}
                      <div className="grid grid-cols-1 gap-3">
                        {ride.status === 'pending' && (
                          <button
                            onClick={() => acceptRide(ride.id)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-md"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            ACCEPT NEXT LEG
                          </button>
                        )}
                        {ride.status === 'accepted' && (
                          <>
                            <button
                              onClick={() => startRide(ride.id)}
                              className="w-full bg-primary-500 hover:bg-primary-400 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-md"
                            >
                              <ChevronRight className="w-5 h-5 mr-2" />
                              {ride.vacation_id ? 'START RIDE' : 'START RIDE'}
                            </button>
                            <button
                              onClick={() => handleRejectRide(ride.id, 'local')}
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-md"
                            >
                              Cancel Ride
                            </button>
                          </>
                        )}
                        {ride.status === 'in_progress' && (
                          <button
                            onClick={() => completeRide(ride.id)}
                            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-md"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {ride.vacation_id ? 'COMPLETE RIDE' : 'COMPLETE RIDE'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rider Location Map - only show when a ride is selected */}
            {selectedRide && driverLocation && (
              <div className="card mt-8">
                <RiderLocationMap ride={selectedRide} driverLoc={driverLocation} />
              </div>
            )}


          </div>
        </div>
        {/* Messages Preview Section */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-primary-500" />
            Messages
          </h2>

          {conversations.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No messages yet</div>
          ) : (
            <div className="space-y-3">
              {conversations.map(conv => (
                <div
                  key={conv.user_id}
                  className="flex justify-between items-center p-3 bg-dark-900/50 rounded-lg hover:bg-dark-700 cursor-pointer transition"
                  onClick={() => handleOpenChat(conv.user_id, conv.name)}
                >
                  <div>
                    <h3 className="font-semibold text-white">{conv.name}</h3>
                    <p className="text-sm text-gray-400 truncate max-w-xs">{conv.last_message}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="fixed bottom-6 left-6 z-50">
        <SafetyMonitor />
      </div>

      {activeChat && (
        <ChatWindow
          currentUser={{ id: user.id, role: 'driver', name: user.full_name }}
          otherUser={{
            id: activeChat.userId,
            role: 'rider',
            name: activeChat.name
          }}
          onClose={() => setActiveChat(null)}
        />
      )}

      <AIChatbot role="driver" />
      {/* Chat Window Overlay */}
      {activeChat && (
        <ChatWindow
          receiverId={activeChat.userId}
          receiverName={activeChat.name}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  )
}

function SafetyMonitor() {
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState('active') // active, warning
  const videoRef = useRef(null)

  const [stream, setStream] = useState(null) // NEW: Store stream in state

  useEffect(() => {
    // Attach stream to video element when it appears
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isActive, stream]);

  // Ref to store interval ID
  const simulationInterval = useRef(null)

  const toggleSafety = async () => {
    if (!isActive) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setStream(newStream);
        setIsActive(true)
        setStatus('active')

        // Continuous Monitoring Simulation
        // Runs every 8-12 seconds to simulate AI detection
        simulationInterval.current = setInterval(() => {
          setStatus('warning')

          // Send Real-time Safety Alert
          // 40% chance of Drowsiness, 60% chance of Distraction (Out of frame)
          const alertType = Math.random() > 0.4 ? 'DISTRACTION' : 'DROWSINESS';
          const alertMessage = alertType === 'DROWSINESS'
            ? 'DANGER! DRIVER DROWSINESS DETECTED'
            : 'DANGER! DRIVER OUT OF FRAME / DISTRACTED';

          websocketService.sendMessage({
            type: 'SAFETY_ALERT',
            message: alertMessage,
            level: 'CRITICAL',
            timestamp: new Date().toISOString()
          })

          setTimeout(() => setStatus('active'), 3000)
        }, 8000);

      } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera access denied or not available.")
      }
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null);
      }

      // Clear interval
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }

      setIsActive(false)
    }
  }

  return (
    <div className={`bg-dark-900 border ${status === 'warning' ? 'border-red-500 animate-pulse' : 'border-dark-700'} rounded-xl shadow-2xl overflow-hidden w-64 transition-all duration-300`}>
      <div className="p-3 bg-dark-800 flex justify-between items-center border-b border-dark-700">
        <div className="flex items-center space-x-2">
          <Shield className={`w-4 h-4 ${isActive ? 'text-green-500' : 'text-gray-500'}`} />
          <span className="font-bold text-xs text-white">SAFETY MONITOR</span>
        </div>
        <button
          onClick={toggleSafety}
          className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${isActive ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${isActive ? 'left-4.5' : 'left-0.5'}`} style={{ left: isActive ? '18px' : '2px' }}></div>
        </button>
      </div>

      {isActive ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-40 object-cover bg-black"
          />
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${status === 'warning' ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span>
            <span className="text-[10px] uppercase font-bold text-white">
              {status === 'warning' ? 'FATIGUE DETECTED' : 'MONITORING'}
            </span>
          </div>
          {status === 'warning' && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
              <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 bg-black flex flex-col items-center justify-center text-gray-500 p-4 text-center">
          <Shield className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">Enable camera to activate AI drowsiness detection</p>
        </div>
      )}
      {/* Chat Window Overlay - REMOVED FROM HERE */}

      {/* Driver Onboarding Modal for New Google Signups */}
      {user?.driver_profile && (user.driver_profile.license_number?.startsWith('GGL') || !user.driver_profile.vehicle_plate) && (
        <DriverOnboardingModal
          user={user}
          onComplete={() => {
            // Refresh full page or just user to ensure state is clean
            window.location.reload();
          }}
        />
      )}
    </div>
  )
}