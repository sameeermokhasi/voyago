import { useState } from 'react';
import { Car, CreditCard, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { userService } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function DriverOnboardingModal({ user, onComplete }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        license_number: '',
        vehicle_type: 'economy',
        vehicle_model: '',
        vehicle_plate: '',
        vehicle_color: '',
        city: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log("Submitting driver profile update:", formData);
            const updatedProfile = await userService.updateDriverProfile({
                ...formData,
                // Ensure user ID is not sent if not needed, handled by backend token
            });

            console.log("Profile updated successfully:", updatedProfile);

            // Update local store
            const { updateUser } = useAuthStore.getState();
            updateUser({
                ...user,
                driver_profile: updatedProfile
            });

            if (onComplete) onComplete();

        } catch (err) {
            console.error("Failed to update profile:", err);
            setError(err.response?.data?.detail || 'Failed to save details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg border border-dark-700 overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-primary-600 p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                    <p className="text-primary-100 text-sm mt-1">
                        We need a few details before you can start driving.
                    </p>
                </div>

                <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* License Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Driving License Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    name="license_number"
                                    value={formData.license_number}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. KA01 2024 1234567"
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Vehicle Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Type</label>
                            <div className="relative">
                                <Car className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <select
                                    name="vehicle_type"
                                    value={formData.vehicle_type}
                                    onChange={handleChange}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                                >
                                    <option value="economy">Economy Cab (4 Seater)</option>
                                    <option value="premium">Premium Cab (Sedan/SUV)</option>
                                    <option value="auto">Auto Rickshaw</option>
                                    <option value="bike">Bike</option>
                                </select>
                            </div>
                        </div>

                        {/* Vehicle Model & Color */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicle_model"
                                    value={formData.vehicle_model}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Swift Dzire"
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Color</label>
                                <input
                                    type="text"
                                    name="vehicle_color"
                                    value={formData.vehicle_color}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. White"
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Vehicle Plate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Plate Number</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-bold px-1.5 py-0.5 rounded">IND</div>
                                <input
                                    type="text"
                                    name="vehicle_plate"
                                    value={formData.vehicle_plate}
                                    onChange={handleChange}
                                    required
                                    placeholder="KA 03 AA 1234"
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl py-2.5 pl-14 pr-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                                />
                            </div>
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Operating City</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Bangalore"
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? 'Saving Details...' : 'Save & Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
