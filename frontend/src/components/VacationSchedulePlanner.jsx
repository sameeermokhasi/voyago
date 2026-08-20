import { useState, useEffect } from 'react'
import { MapPin, Plane, Train, Car, Calendar, Clock, Plus, Trash2 } from 'lucide-react'
import { vacationService, vacationSchedulerService } from '../services/api'
import { useLocation } from 'react-router-dom'
import ChromaGrid from './ChromaGrid'

export default function VacationSchedulePlanner() {
  const location = useLocation();

  const [tripDetails, setTripDetails] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    passengers: 1,
    vehicleType: 'economy',
    rideIncluded: true,
    hotelName: '', // Remove hotelIncluded since it's handled by rider
    hotelAddress: ''
  })

  const [flightDetails, setFlightDetails] = useState({
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    flightNumber: ''
  })

  const [activities, setActivities] = useState([])

  const [currentActivity, setCurrentActivity] = useState({
    date: '',
    time: '',
    location: '',
    description: ''
  })

  // Pre-fill from AI Suggestion
  useEffect(() => {
    if (location.state && location.state.aiSuggestion) {
      const ai = location.state.aiSuggestion;
      const details = ai.details || {};
      console.log("Auto-filling from AI Plan:", ai, details);

      const destName = details.destination || (ai.destination ? `${ai.destination}, India` : '');
      const startD = details.startDate || '';
      const endD = details.endDate || '';

      setTripDetails(prev => ({
        ...prev,
        destination: destName,
        startDate: startD,
        endDate: endD,
        passengers: details.passengers || 2,
        vehicleType: details.vehicleType || (ai.tier?.key === 'luxury' ? 'luxury' : ai.tier?.key === 'better' ? 'suv' : 'economy'),
        rideIncluded: true,
        hotelName: details.hotelName || (ai.destination ? `The Grand ${ai.destination} Resort & Palace` : '')
      }));

      // Pre-fill Travel / Flight Details
      setFlightDetails({
        departureCity: details.flightDetails?.departureCity || 'Bangalore',
        arrivalCity: details.flightDetails?.arrivalCity || ai.destination || '',
        departureTime: details.flightDetails?.departureTime || (startD ? `${startD}T08:30` : ''),
        arrivalTime: details.flightDetails?.arrivalTime || (startD ? `${startD}T11:45` : ''),
        flightNumber: details.flightDetails?.flightNumber || 'VY-842'
      });

      // Pre-fill Activities Schedule
      if (details.activities && details.activities.length > 0) {
        setActivities(details.activities);
      }
    }
  }, [location.state]);

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddActivity = () => {
    if (currentActivity.date && currentActivity.time && currentActivity.location && currentActivity.description) {
      setActivities([...activities, { ...currentActivity }]) // Create a copy of the object
      setCurrentActivity({
        date: '',
        time: '',
        location: '',
        description: ''
      })
    }
  }

  const handleRemoveActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate activities
    if (activities.length === 0) {
      alert('Please schedule at least one activity for your vacation.')
      setIsSubmitting(false)
      return
    }

    try {
      // Create schedule object
      const schedule = {
        flightDetails: flightDetails.flightNumber ?
          `${flightDetails.departureCity} to ${flightDetails.arrivalCity} (${flightDetails.flightNumber})` :
          '',
        activities: activities.map(a => `${a.date} ${a.time} - ${a.location}: ${a.description}`).join('; ')
      }

      // Create vacation booking
      // Create vacation booking with snake_case keys for backend
      const vacationData = {
        destination: tripDetails.destination,
        start_date: tripDetails.startDate,
        end_date: tripDetails.endDate,
        passengers: tripDetails.passengers,
        vehicle_type: tripDetails.vehicleType,
        ride_included: tripDetails.rideIncluded,
        hotel_name: tripDetails.hotelName,
        hotel_address: tripDetails.hotelAddress,
        schedule: JSON.stringify(schedule),
        flight_details: JSON.stringify(flightDetails),
        meal_preferences: '{}',
        activities: JSON.stringify(activities)
      }

      const response = await vacationService.createVacation(vacationData)
      alert('Vacation booking created successfully!')

      // Automatically schedule rides for the vacation
      if (response.id) {
        try {
          await vacationSchedulerService.scheduleVacationRides(response.id)
          alert('Automated rides scheduled successfully!')
        } catch (error) {
          console.error('Failed to schedule automated rides:', error)
          alert('Vacation created but failed to schedule automated rides. You can schedule them later.')
        }
      }

      // Reset form
      setTripDetails({
        destination: '',
        startDate: '',
        endDate: '',
        passengers: 1,
        vehicleType: 'economy',
        rideIncluded: true,
        hotelName: '',
        hotelAddress: ''
      })

      setFlightDetails({
        departureCity: '',
        arrivalCity: '',
        departureTime: '',
        arrivalTime: '',
        flightNumber: ''
      })



      setActivities([])
    } catch (error) {
      console.error('Failed to create vacation booking:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
      alert(`Failed to create vacation booking: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const gridItems = [
    {
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=60",
      title: "Air Travel",
      subtitle: "Seamless Connections",
      borderColor: "#3B82F6",
      gradient: "linear-gradient(145deg, #3B82F6, #000)"
    },
    {
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&auto=format&fit=crop&q=60",
      title: "Mountain Escapes",
      subtitle: "Adventure Awaits",
      borderColor: "#10B981",
      gradient: "linear-gradient(180deg, #10B981, #000)"
    },
    {
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60",
      title: "Beach Paradise",
      subtitle: "Relax & Unwind",
      borderColor: "#F59E0B",
      gradient: "linear-gradient(165deg, #F59E0B, #000)"
    },
    {
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=500&auto=format&fit=crop&q=60",
      title: "Cultural Heritage",
      subtitle: "Timeless Temples",
      borderColor: "#EF4444",
      gradient: "linear-gradient(195deg, #EF4444, #000)"
    },
    {
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&auto=format&fit=crop&q=60",
      title: "Premium Rides",
      subtitle: "Luxury Transport",
      borderColor: "#8B5CF6",
      gradient: "linear-gradient(225deg, #8B5CF6, #000)"
    },
    {
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=60",
      title: "Road Trips",
      subtitle: "Explore Freely",
      borderColor: "#06B6D4",
      gradient: "linear-gradient(135deg, #06B6D4, #000)"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 opacity-50">
        <ChromaGrid
          items={gridItems}
          radius={300}
          damping={0.45}
          fadeOut={0.6}
          ease="power3.out"
        />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow-lg">✈️ Plan Your Automated Vacation</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Trip Details */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2" />
              Trip Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination</label>
                <input
                  type="text"
                  value={tripDetails.destination}
                  onChange={(e) => setTripDetails({ ...tripDetails, destination: e.target.value })}
                  className="input-field text-white"
                  placeholder="e.g., Goa, India"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hotel Name</label>
                <input
                  type="text"
                  value={tripDetails.hotelName}
                  onChange={(e) => setTripDetails({ ...tripDetails, hotelName: e.target.value })}
                  className="input-field text-white"
                  placeholder="e.g., Taj Exotica Resort"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={tripDetails.startDate}
                  min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                  onChange={(e) => setTripDetails({ ...tripDetails, startDate: e.target.value })}
                  className="input-field text-white [color-scheme:dark]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={tripDetails.endDate}
                  min={tripDetails.startDate || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                  onChange={(e) => setTripDetails({ ...tripDetails, endDate: e.target.value })}
                  className="input-field text-white [color-scheme:dark]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Passengers</label>
                <select
                  value={tripDetails.passengers}
                  onChange={(e) => setTripDetails({ ...tripDetails, passengers: parseInt(e.target.value) })}
                  className="input-field text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                <select
                  value={tripDetails.vehicleType}
                  onChange={(e) => setTripDetails({ ...tripDetails, vehicleType: e.target.value })}
                  className="input-field text-white"
                >
                  <option value="economy">Economy</option>
                  <option value="premium">Premium</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={tripDetails.rideIncluded}
                  onChange={(e) => setTripDetails({ ...tripDetails, rideIncluded: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-300 flex items-center">
                  <Car className="w-4 h-4 mr-1" />
                  Include Transportation
                </span>
              </label>

              {/* Remove the INCLUDE HOTEL checkbox as it's handled by the rider */}
            </div>
          </div>

          {/* Flight/Train Details */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Plane className="w-6 h-6 mr-2" />
              Travel Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Departure City</label>
                <input
                  type="text"
                  value={flightDetails.departureCity}
                  onChange={(e) => setFlightDetails({ ...flightDetails, departureCity: e.target.value })}
                  className="input-field text-white"
                  placeholder="e.g., Bangalore"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Arrival City</label>
                <input
                  type="text"
                  value={flightDetails.arrivalCity}
                  onChange={(e) => setFlightDetails({ ...flightDetails, arrivalCity: e.target.value })}
                  className="input-field text-white"
                  placeholder="e.g., Goa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Departure Time</label>
                <input
                  type="datetime-local"
                  value={flightDetails.departureTime}
                  min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T00:00'}
                  onChange={(e) => setFlightDetails({ ...flightDetails, departureTime: e.target.value })}
                  className="input-field text-white [color-scheme:dark]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Arrival Time</label>
                <input
                  type="datetime-local"
                  value={flightDetails.arrivalTime}
                  min={flightDetails.departureTime || (new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T00:00')}
                  onChange={(e) => setFlightDetails({ ...flightDetails, arrivalTime: e.target.value })}
                  className="input-field text-white [color-scheme:dark]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Flight/Train Number</label>
                <input
                  type="text"
                  value={flightDetails.flightNumber}
                  onChange={(e) => setFlightDetails({ ...flightDetails, flightNumber: e.target.value })}
                  className="input-field text-white"
                  placeholder="e.g., AI-123 or 12345"
                  required
                />
              </div>
            </div>
          </div>



          {/* Activities Schedule */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Activities Schedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={currentActivity.date}
                  min={tripDetails.startDate || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                  onChange={(e) => setCurrentActivity({ ...currentActivity, date: e.target.value })}
                  className="input-field text-white [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                <input
                  type="time"
                  value={currentActivity.time}
                  onChange={(e) => setCurrentActivity({ ...currentActivity, time: e.target.value })}
                  className="input-field text-white [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={currentActivity.location}
                  onChange={(e) => setCurrentActivity({ ...currentActivity, location: e.target.value })}
                  className="input-field text-white"
                  placeholder="e.g., Beach, Museum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={currentActivity.description}
                  onChange={(e) => setCurrentActivity({ ...currentActivity, description: e.target.value })}
                  className="input-field text-white"
                  placeholder="Activity details"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddActivity}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </button>

            {activities.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium">Scheduled Activities</h3>
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-dark-600">
                    <div>
                      <p className="font-medium text-white">{activity.date} {activity.time} - {activity.location}</p>
                      <p className="text-sm text-gray-400">{activity.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary btn-lg w-full md:w-auto"
            >
              {isSubmitting ? 'Creating Vacation...' : 'Create Automated Vacation Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}