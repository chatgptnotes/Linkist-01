'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LoopIcon from '@mui/icons-material/Loop';
import SearchIcon from '@mui/icons-material/Search';

// Icon aliases
const MapPin = LocationOnIcon;
const LoaderIcon = LoopIcon;
const Search = SearchIcon;

// Declare global google types
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

// Types for address data
interface AddressData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  displayName?: string;
}

interface GoogleMapPickerProps {
  initialAddress?: Partial<AddressData>;
  onAddressChange: (address: AddressData) => void;
  className?: string;
}

export default function GoogleMapPicker({
  initialAddress,
  onAddressChange,
  className = ''
}: GoogleMapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const [addressData, setAddressData] = useState<AddressData>({
    addressLine1: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
  });

  // Initialize Google Maps using script tag
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        console.log('🗺️ Initializing Google Maps...');
        console.log('API Key present:', apiKey ? '✅ Yes' : '❌ No');

        if (!apiKey) {
          throw new Error('Google Maps API key not found in environment variables');
        }

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted) return;

        // Check if Google Maps script is already loaded or being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');

        if (!window.google && !existingScript) {
          console.log('📦 Loading Google Maps script...');
          // Load Google Maps API via script tag only if not already present
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`;
          script.async = true;
          script.defer = true;

          await new Promise<void>((resolve, reject) => {
            // Timeout after 15 seconds
            timeoutId = setTimeout(() => {
              console.error('⏱️ Timeout: Google Maps took too long to load');
              reject(new Error('Timeout loading Google Maps. Check your internet connection and API key.'));
            }, 15000);

            script.onload = () => {
              clearTimeout(timeoutId);
              console.log('✅ Google Maps script loaded successfully');
              resolve();
            };

            script.onerror = (error) => {
              clearTimeout(timeoutId);
              console.error('❌ Failed to load Google Maps script:', error);
              reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
            };

            document.head.appendChild(script);
          });
        } else if (existingScript && !window.google) {
          console.log('⏳ Waiting for existing Google Maps script to load...');
          // Wait for existing script to load with timeout
          await new Promise<void>((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds

            const checkGoogle = setInterval(() => {
              attempts++;
              if (window.google) {
                console.log('✅ Google Maps loaded from existing script');
                clearInterval(checkGoogle);
                resolve();
              } else if (attempts >= maxAttempts) {
                console.error('⏱️ Timeout waiting for Google Maps');
                clearInterval(checkGoogle);
                reject(new Error('Timeout waiting for Google Maps to load'));
              }
            }, 100);
          });
        } else {
          console.log('✅ Google Maps already loaded');
        }

        if (!isMounted) return;

        if (!mapContainer.current) {
          console.error('Map container not found in DOM');
          setLocationError('Unable to initialize map container. Please refresh the page.');
          setMapLoaded(true);
          return;
        }

        if (!window.google) {
          console.error('Google Maps not loaded');
          setLocationError('Failed to load Google Maps. Please refresh the page.');
          setMapLoaded(true);
          return;
        }

        // Default position (Dubai)
        const initialLat = initialAddress?.latitude || 25.2048;
        const initialLng = initialAddress?.longitude || 55.2708;

        // Initialize map
        map.current = new google.maps.Map(mapContainer.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        // Initialize geocoder
        geocoder.current = new google.maps.Geocoder();
        autocompleteService.current = new google.maps.places.AutocompleteService();

        // Add marker
        marker.current = new google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: map.current,
          draggable: true,
          title: 'Drag to adjust location'
        });

        // Handle marker drag
        marker.current.addListener('dragend', () => {
          if (marker.current) {
            const position = marker.current.getPosition();
            if (position) {
              reverseGeocode(position.lat(), position.lng());
            }
          }
        });

        // Handle map click
        map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && marker.current) {
            marker.current.setPosition(e.latLng);
            reverseGeocode(e.latLng.lat(), e.latLng.lng());
          }
        });

        // Load initial address if provided
        if (initialAddress?.latitude && initialAddress?.longitude) {
          reverseGeocode(initialAddress.latitude, initialAddress.longitude);
        }

        console.log('Google Maps initialized successfully');
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLocationError('Failed to load Google Maps. Please check your API key.');
        setMapLoaded(true); // Set to true so error message shows
      }
    };

    initMap();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Handle click outside to close predictions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reverse geocode (get address from coordinates)
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoder.current) return;

    setIsLoading(true);
    try {
      const result = await geocoder.current.geocode({
        location: { lat, lng }
      });

      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        const addressComponents = place.address_components || [];

        // Extract address components
        const getComponent = (type: string) => {
          const component = addressComponents.find(c => c.types.includes(type));
          return component?.long_name || '';
        };

        const streetNumber = getComponent('street_number');
        const route = getComponent('route');
        const sublocalityLevel1 = getComponent('sublocality_level_1');
        const sublocalityLevel2 = getComponent('sublocality_level_2');
        const neighborhood = getComponent('neighborhood');
        const locality = getComponent('locality') || getComponent('administrative_area_level_2');
        const adminArea1 = getComponent('administrative_area_level_1');
        const postalCode = getComponent('postal_code');
        const country = getComponent('country');

        // Address Line 1: Street number + Route (e.g., "Shop no. 10, Baba Farid Nagar")
        const addressLine1Parts = [streetNumber, route].filter(Boolean);
        const addressLine1 = addressLine1Parts.length > 0
          ? addressLine1Parts.join(', ')
          : route || sublocalityLevel2 || neighborhood || '';

        // Address Line 2: Sublocality levels + Neighborhood (e.g., "Ratanlal Plots, Sitabuldi")
        const addressLine2Parts = [sublocalityLevel2, sublocalityLevel1, neighborhood].filter(Boolean);
        const addressLine2 = addressLine2Parts.length > 0
          ? addressLine2Parts.slice(0, 2).join(', ') // Take first 2 parts only
          : '';

        const newAddressData: AddressData = {
          addressLine1: addressLine1,
          addressLine2: addressLine2,
          city: locality || '',
          stateProvince: adminArea1 || '',
          postalCode: postalCode || '',
          country: country || '',
          countryCode: addressComponents.find(c => c.types.includes('country'))?.short_name || '',
          latitude: lat,
          longitude: lng,
          area: sublocalityLevel1 || sublocalityLevel2 || '',
          displayName: place.formatted_address || '',
        };

        console.log('📍 Address extracted:', {
          addressLine1: newAddressData.addressLine1,
          addressLine2: newAddressData.addressLine2,
          city: newAddressData.city,
          stateProvince: newAddressData.stateProvince,
          postalCode: newAddressData.postalCode,
          country: newAddressData.country,
          countryCode: newAddressData.countryCode,
        });

        setAddressData(newAddressData);
        onAddressChange(newAddressData);

        // Update marker info window
        if (marker.current) {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <strong style="font-size: 14px;">Selected Location</strong><br/>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">${place.formatted_address}</p>
                <small style="font-size: 10px; color: #999;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
              </div>
            `
          });
          infoWindow.open(map.current, marker.current);
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationError('Failed to get address for this location');
    } finally {
      setIsLoading(false);
    }
  }, [onAddressChange]);

  // Fetch autocomplete predictions
  const fetchPredictions = useCallback(async (input: string) => {
    if (!input.trim() || !autocompleteService.current) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      const result = await autocompleteService.current.getPlacePredictions({
        input,
        types: ['geocode', 'establishment'],
      });

      if (result.predictions && result.predictions.length > 0) {
        setPredictions(result.predictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictions([]);
      setShowPredictions(false);
    }
  }, []);

  // Handle prediction selection
  const handlePredictionSelect = useCallback(async (prediction: google.maps.places.AutocompletePrediction) => {
    setSearchQuery(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    // Geocode the selected place
    if (!geocoder.current) return;

    setIsLoading(true);
    setLocationError('');

    try {
      const result = await geocoder.current.geocode({
        placeId: prediction.place_id
      });

      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        const location = place.geometry?.location;

        if (location && map.current && marker.current) {
          const lat = location.lat();
          const lng = location.lng();

          map.current.setCenter({ lat, lng });
          map.current.setZoom(15);
          marker.current.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Error loading selected location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [reverseGeocode]);

  // Get current location from GPS
  const getCurrentLocation = useCallback(() => {
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (map.current && marker.current) {
          const newPosition = { lat: latitude, lng: longitude };
          map.current.setCenter(newPosition);
          map.current.setZoom(16);
          marker.current.setPosition(newPosition);
          reverseGeocode(latitude, longitude);
        }
        setIsLoading(false);
        setLocationError('');
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Unable to get location';

        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable. Please check your device location settings.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out. Please try again.';
            break;
        }
        setLocationError(errorMsg);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }, [reverseGeocode]);

  // Handle checkbox change
  const handleUseCurrentLocationChange = (checked: boolean) => {
    setUseCurrentLocation(checked);
    if (checked) {
      getCurrentLocation();
    }
  };

  // Search for address using Google Places Autocomplete
  const searchAddress = useCallback(async () => {
    if (!searchQuery.trim() || !geocoder.current) return;

    setIsLoading(true);
    setLocationError('');

    try {
      const result = await geocoder.current.geocode({
        address: searchQuery
      });

      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        const location = place.geometry?.location;

        if (location && map.current && marker.current) {
          const lat = location.lat();
          const lng = location.lng();

          map.current.setCenter({ lat, lng });
          map.current.setZoom(15);
          marker.current.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        }
      } else {
        setLocationError('Address not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Error searching for address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, reverseGeocode]);

  return (
    <div className={`${className} space-y-4`}>
      {/* Current Location Checkbox */}
      <div className="border rounded-lg p-3" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useCurrentLocation}
            onChange={(e) => handleUseCurrentLocationChange(e.target.checked)}
            disabled={isLoading}
            className="mt-1 h-5 w-5 rounded focus:ring-2"
            style={{
              accentColor: '#2563EB',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          />
          <div className="flex-1">
            <span className="font-medium" style={{ color: '#111827' }}>Use my current location</span>
            <p className="text-sm mt-0.5" style={{ color: '#4B5563' }}>
              Automatically detect your location using GPS
            </p>
            {locationError && useCurrentLocation && (
              <div className="text-sm text-red-600 mt-2 bg-red-50 border border-red-200 rounded-md p-3">
                {locationError}
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (locationError && !useCurrentLocation) setLocationError('');
                // Trigger autocomplete predictions
                fetchPredictions(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (predictions.length > 0 && showPredictions) {
                    // Select first prediction on Enter
                    handlePredictionSelect(predictions[0]);
                  } else {
                    searchAddress();
                  }
                } else if (e.key === 'Escape') {
                  setShowPredictions(false);
                }
              }}
              onFocus={() => {
                if (predictions.length > 0) {
                  setShowPredictions(true);
                }
              }}
              placeholder="Search for an address, landmark, or area..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              autoComplete="off"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />

            {/* Autocomplete Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div
                ref={predictionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {predictions.map((prediction, index) => (
                  <div
                    key={prediction.place_id}
                    onClick={() => handlePredictionSelect(prediction)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {prediction.structured_formatting.main_text}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {prediction.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={searchAddress}
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Error Message */}
        {locationError && !useCurrentLocation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">{locationError}</p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative z-0">
        <div
          ref={mapContainer}
          className="h-96 w-full rounded-lg overflow-hidden border-2 border-gray-200"
        />

        {/* Initial Loading Overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center rounded-lg z-20">
            <div className="text-center">
              {locationError ? (
                <>
                  <p className="text-sm text-red-600 mb-2 font-medium">{locationError}</p>
                  <p className="text-xs text-gray-600 mb-4">Please refresh the page or check your Google Maps API configuration.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Refresh Page
                  </button>
                </>
              ) : (
                <>
                  <LoaderIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading Google Maps...</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Address Loading Overlay */}
        {mapLoaded && isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <div className="flex items-center space-x-2">
              <LoaderIcon className="h-5 w-5 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Getting address...</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="flex items-start space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <MapPin className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-gray-700">How to use:</p>
          <ul className="text-xs mt-1 space-y-1">
            <li>• Click anywhere on the map to set your location</li>
            <li>• Drag the red marker to adjust the position</li>
            <li>• Use the search bar to find a specific address</li>
            <li>• Enable "Use my current location" for GPS detection</li>
          </ul>
        </div>
      </div>

      {/* Detected Address Info */}
      {addressData.displayName && (
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <p className="font-medium text-gray-700 mb-1">Detected Location:</p>
          <p className="text-xs text-gray-600">{addressData.displayName}</p>
          {addressData.latitude && addressData.longitude && (
            <p className="text-xs text-gray-500 mt-1">
              GPS: {addressData.latitude.toFixed(6)}, {addressData.longitude.toFixed(6)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
