'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Country, State, City } from 'country-state-city';
import type { UseFormSetValue, FieldErrors } from 'react-hook-form';

interface AddressData {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
}

interface LocationDropdownsProps {
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  initialCountry?: string;
  watchedCountry?: string;
  onGpsCoordinatesChange?: (coords: { latitude?: number; longitude?: number; area?: string }) => void;
}

export interface LocationDropdownsRef {
  handleMapAddressChange: (addressData: AddressData) => void;
}

const LocationDropdowns = forwardRef<LocationDropdownsRef, LocationDropdownsProps>(({
  setValue,
  errors,
  initialCountry = 'IN',
  watchedCountry,
  onGpsCoordinatesChange,
}, ref) => {
  // Location dropdown states
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [isUpdatingFromMap, setIsUpdatingFromMap] = useState(false);
  const previousStateRef = useRef<string>('');
  const previousCountryRef = useRef<string>('');

  // Keep country dropdown state in sync with form value
  useEffect(() => {
    if (watchedCountry && selectedCountry !== watchedCountry) {
      setSelectedCountry(watchedCountry);
      previousCountryRef.current = watchedCountry;
      const states = State.getStatesOfCountry(watchedCountry);
      setAvailableStates(states);
    }
  }, [watchedCountry, selectedCountry]);

  // Handle country change - load states for selected country
  useEffect(() => {
    if (selectedCountry && selectedCountry !== previousCountryRef.current && !isUpdatingFromMap) {
      const states = State.getStatesOfCountry(selectedCountry);
      setAvailableStates(states);
      setSelectedState('');
      setSelectedCity('');
      setValue('stateProvince', '');
      setValue('city', '');

      // For UAE, use Emirates as cities directly
      if (selectedCountry === 'AE') {
        const emiratesAsCities = states.map(state => ({
          name: state.name.replace(' Emirate', ''),
          stateCode: state.isoCode,
          countryCode: state.countryCode
        }));
        setAvailableCities(emiratesAsCities as any);
      } else {
        setAvailableCities([]);
      }

      previousCountryRef.current = selectedCountry;
    }
  }, [selectedCountry, setValue, isUpdatingFromMap]);

  // Handle state change - load cities for selected state
  useEffect(() => {
    if (selectedCountry && selectedState && !isUpdatingFromMap) {
      const stateChanged = previousStateRef.current !== '' && previousStateRef.current !== selectedState;
      const cities = City.getCitiesOfState(selectedCountry, selectedState);
      setAvailableCities(cities);

      if (stateChanged) {
        setSelectedCity('');
        setValue('city', '');
      }

      previousStateRef.current = selectedState;
    }
  }, [selectedState, selectedCountry, setValue, isUpdatingFromMap]);

  // Handle address update from map
  const handleMapAddressChange = (addressData: AddressData) => {
    console.log('📍 Map address changed:', addressData);
    console.log('📍 Full address data:', JSON.stringify(addressData, null, 2));

    setIsUpdatingFromMap(true);

    if (addressData.addressLine1) setValue('addressLine1', addressData.addressLine1);
    if (addressData.addressLine2) setValue('addressLine2', addressData.addressLine2);
    if (addressData.postalCode) setValue('postalCode', addressData.postalCode);

    if (addressData.countryCode) {
      const country = Country.getAllCountries().find(c => c.isoCode === addressData.countryCode);

      if (!country) {
        console.error('❌ Country not found for code:', addressData.countryCode);
        setIsUpdatingFromMap(false);
        return;
      }

      console.log('🌍 Country found:', country.isoCode, country.name);

      setSelectedCountry(country.isoCode);
      previousCountryRef.current = country.isoCode;
      setValue('country', country.isoCode);

      const states = State.getStatesOfCountry(country.isoCode);
      console.log(`📍 Found ${states.length} states for ${country.name}`);
      setAvailableStates(states);

      if (addressData.stateProvince) {
        console.log('📍 Looking for state:', addressData.stateProvince);

        if (states.length === 0) {
          console.log('⚠️ No states available in library, setting directly');
          setSelectedState(addressData.stateProvince);
          previousStateRef.current = addressData.stateProvince;
          setValue('stateProvince', addressData.stateProvince);
          if (addressData.city) {
            setValue('city', addressData.city);
            setSelectedCity(addressData.city);
          }
        } else {
          const state = states.find(s =>
            s.name.toLowerCase() === addressData.stateProvince!.toLowerCase() ||
            s.isoCode.toLowerCase() === addressData.stateProvince!.toLowerCase()
          );

          if (state) {
            console.log('✅ State found:', state.isoCode, state.name);

            const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
            console.log(`🏙️ Found ${cities.length} cities for ${state.name}`);

            setSelectedState(state.isoCode);
            previousStateRef.current = state.isoCode;
            setValue('stateProvince', state.name);
            setAvailableCities(cities);

            if (addressData.city) {
              console.log('🏙️ Looking for city:', addressData.city);

              if (cities.length === 0) {
                console.log('⚠️ No cities available in library, setting directly');
                setSelectedCity(addressData.city);
                setValue('city', addressData.city);
              } else {
                const city = cities.find(c =>
                  c.name.toLowerCase() === addressData.city!.toLowerCase()
                );

                if (city) {
                  console.log('✅ City found:', city.name);
                  setSelectedCity(city.name);
                  setValue('city', city.name);
                } else {
                  console.log('⚠️ City not found in library, setting directly:', addressData.city);
                  setSelectedCity(addressData.city);
                  setValue('city', addressData.city);
                }
              }
            }
          } else {
            console.log('⚠️ State not found in library, setting directly:', addressData.stateProvince);
            setSelectedState(addressData.stateProvince);
            previousStateRef.current = addressData.stateProvince;
            setValue('stateProvince', addressData.stateProvince);

            if (addressData.city) {
              setSelectedCity(addressData.city);
              setValue('city', addressData.city);
            }
          }
        }
      } else if (addressData.city) {
        console.log('🏙️ Setting city without state:', addressData.city);
        setSelectedCity(addressData.city);
        setValue('city', addressData.city);
      }
    }

    // Notify parent of GPS coordinates
    if (onGpsCoordinatesChange) {
      onGpsCoordinatesChange({
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        area: addressData.area,
      });
    }

    setTimeout(() => {
      setIsUpdatingFromMap(false);
      console.log('✅ Map update complete');
    }, 300);
  };

  // Expose handleMapAddressChange to parent via ref
  useImperativeHandle(ref, () => ({
    handleMapAddressChange
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {/* City/Emirate dropdown - full width for UAE */}
        <div className={selectedCountry === 'AE' ? 'col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedCountry === 'AE' ? 'Emirate *' : 'City *'}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              const cityName = e.target.value;
              setSelectedCity(cityName);
              setValue('city', cityName);
              if (selectedCountry === 'AE') {
                setValue('stateProvince', cityName);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">{selectedCountry === 'AE' ? 'Select Emirate' : 'Select City'}</option>
            {selectedCity && !availableCities.find(c => c.name === selectedCity) && (
              <option value={selectedCity}>{selectedCity}</option>
            )}
            {availableCities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{(errors.city as any).message}</p>
          )}
          {selectedCity && !availableCities.find(c => c.name === selectedCity) && (
            <p className="text-xs text-gray-500 mt-1">{selectedCountry === 'AE' ? 'Emirate' : 'City'} auto-filled from map (you can change if needed)</p>
          )}
        </div>
        {/* State/Province dropdown - hidden for UAE */}
        {selectedCountry !== 'AE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                const stateCode = e.target.value;
                setSelectedState(stateCode);
                const stateName = availableStates.find(s => s.isoCode === stateCode)?.name || stateCode;
                setValue('stateProvince', stateName);

                if (!isUpdatingFromMap && stateCode && selectedCountry) {
                  const cities = City.getCitiesOfState(selectedCountry, stateCode);
                  setAvailableCities(cities);
                  setSelectedCity('');
                  setValue('city', '');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select State/Province</option>
              {selectedState && !availableStates.find(s => s.isoCode === selectedState) && (
                <option value={selectedState}>
                  {selectedState}
                </option>
              )}
              {availableStates.map((state) => (
                <option key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
            {selectedState && !availableStates.find(s => s.isoCode === selectedState) && (
              <p className="text-xs text-gray-500 mt-1">State auto-filled from map (you can change if needed)</p>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => {
              const countryCode = e.target.value;
              setSelectedCountry(countryCode);
              previousCountryRef.current = countryCode;
              setValue('country', countryCode);

              if (countryCode) {
                const states = State.getStatesOfCountry(countryCode);
                setAvailableStates(states);
                setSelectedState('');
                setSelectedCity('');
                setValue('stateProvince', '');
                setValue('city', '');

                if (countryCode === 'AE') {
                  const emiratesAsCities = states.map(state => ({
                    name: state.name.replace(' Emirate', ''),
                    stateCode: state.isoCode,
                    countryCode: state.countryCode
                  }));
                  setAvailableCities(emiratesAsCities as any);
                } else {
                  setAvailableCities([]);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select Country</option>
            {Country.getAllCountries().map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{(errors.country as any).message}</p>
          )}
        </div>
      </div>
    </>
  );
});

LocationDropdowns.displayName = 'LocationDropdowns';

export default LocationDropdowns;
export type { AddressData };
