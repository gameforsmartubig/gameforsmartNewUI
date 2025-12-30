"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, ChevronDown, X, Search, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  emoji: string;
  latitude: number;
  longitude: number;
  translations?: Record<string, string>;
}

interface State {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  latitude: number;
  longitude: number;
  translations?: Record<string, string>;
}

interface City {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: number;
  longitude: number;
  translations?: Record<string, string>;
}

interface LocationValue {
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  countryName: string;
  stateName: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
  disabled?: boolean;
  layout?: "vertical" | "horizontal";
  showDetectButton?: boolean;
  showClearButton?: boolean;
}

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  value: { id: number | null; name: string };
  options: Array<{ id: number; name: string; emoji?: string; iso2?: string }>;
  onSearch: (query: string) => void;
  onSelect: (option: { id: number; name: string; emoji?: string; latitude?: number; longitude?: number }) => void;
  onClear: () => void;
  onOpen?: () => void;
  loading: boolean;
  disabled?: boolean;
  searchQuery: string;
  icon?: React.ReactNode;
  showClearButton?: boolean;
}

function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onSearch,
  onSelect,
  onClear,
  onOpen,
  loading,
  disabled,
  searchQuery,
  icon,
  showClearButton = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilter, setLocalFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setLocalFilter("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && onOpen) {
        onOpen();
      }
      setLocalFilter("");
    }
  };

  const filteredOptions = localFilter
    ? options.filter(opt => opt.name.toLowerCase().includes(localFilter.toLowerCase()))
    : options;

  return (
    <div className="space-y-1" ref={containerRef}>
      <Label className="text-gray-700 font-medium text-sm">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
          {icon || <MapPin className="h-4 w-4" />}
        </div>
        
        <div
          className={cn(
            "flex items-center justify-between pl-9 pr-3 h-10 border-2 border-gray-200 rounded-xl bg-white cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50",
            isOpen && "border-blue-500"
          )}
          onClick={handleOpen}
        >
          <span className={cn("text-sm truncate", value.id ? "text-gray-900" : "text-gray-400")}>
            {value.id ? value.name : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {loading && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
            {value.id && !disabled && showClearButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-0.5 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="sticky top-0 bg-white p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Filter..."
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                  className="pl-8 h-8 text-sm border-gray-200"
                  autoFocus
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filteredOptions.length > 0 ? (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => {
                      onSelect(option as any);
                      setIsOpen(false);
                      setLocalFilter("");
                    }}
                  >
                    {option.emoji && <span className="text-base">{option.emoji}</span>}
                    {option.iso2 && !option.emoji && (
                      <span className={`fi fi-${option.iso2.toLowerCase()}`} style={{ fontSize: "1em" }} />
                    )}
                    <span className="text-gray-900">{option.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Tidak ditemukan
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LocationSelector({ value, onChange, className, disabled, layout = "vertical", showDetectButton = true, showClearButton = true }: LocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  const [countriesFetched, setCountriesFetched] = useState(false);
  const [statesFetched, setStatesFetched] = useState(false);
  const [citiesFetched, setCitiesFetched] = useState(false);

  // Function to detect user's location using geolocation
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolocation");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Call our reverse geocode API
          const response = await fetch(
            `/api/locations/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Gagal mendeteksi lokasi");
          }

          const data = await response.json();

          if (data.success) {
            // Update location value with detected data
            onChange({
              countryId: data.country?.id || null,
              stateId: data.state?.id || null,
              cityId: data.city?.id || null,
              countryName: data.country?.name || "",
              stateName: data.state?.name || "",
              cityName: data.city?.name || "",
              latitude: data.city?.latitude || data.state?.latitude || data.country?.latitude || latitude,
              longitude: data.city?.longitude || data.state?.longitude || data.country?.longitude || longitude,
            });

            // Show success message with detected location
            const locationParts = [data.city?.name, data.state?.name, data.country?.name].filter(Boolean);
            toast.success(`Lokasi terdeteksi: ${locationParts.join(", ")}`);
          } else {
            throw new Error("Gagal mendeteksi lokasi");
          }
        } catch (error: any) {
          console.error("Error detecting location:", error);
          toast.error(error.message || "Gagal mendeteksi lokasi");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Informasi lokasi tidak tersedia");
            break;
          case error.TIMEOUT:
            toast.error("Waktu permintaan lokasi habis");
            break;
          default:
            toast.error("Gagal mendapatkan lokasi");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  // Fetch countries when dropdown opens
  const fetchCountries = useCallback(async () => {
    if (countriesFetched || loadingCountries) return;
    
    setLoadingCountries(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "250");
      
      const res = await fetch(`/api/locations/countries?${params}`);
      const data = await res.json();
      const sortedCountries = (data.countries || []).sort((a: Country, b: Country) => 
        a.name.localeCompare(b.name)
      );
      setCountries(sortedCountries);
      setCountriesFetched(true);
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoadingCountries(false);
    }
  }, [countriesFetched, loadingCountries]);

  // Fetch states when dropdown opens
  const fetchStates = useCallback(async () => {
    if (!value.countryId || loadingStates) return;
    
    setLoadingStates(true);
    try {
      const params = new URLSearchParams();
      params.set("countryId", value.countryId.toString());
      params.set("limit", "500");
      
      const res = await fetch(`/api/locations/states?${params}`);
      const data = await res.json();
      const sortedStates = (data.states || []).sort((a: State, b: State) => 
        a.name.localeCompare(b.name)
      );
      setStates(sortedStates);
      setStatesFetched(true);
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoadingStates(false);
    }
  }, [value.countryId, loadingStates]);

  // Fetch cities when dropdown opens
  const fetchCities = useCallback(async () => {
    if (!value.stateId || loadingCities) return;
    
    setLoadingCities(true);
    try {
      const params = new URLSearchParams();
      params.set("stateId", value.stateId.toString());
      params.set("limit", "500");
      
      const res = await fetch(`/api/locations/cities?${params}`);
      const data = await res.json();
      const sortedCities = (data.cities || []).sort((a: City, b: City) => 
        a.name.localeCompare(b.name)
      );
      setCities(sortedCities);
      setCitiesFetched(true);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoadingCities(false);
    }
  }, [value.stateId, loadingCities]);

  // Reset states when country changes
  useEffect(() => {
    setStates([]);
    setStatesFetched(false);
    setCities([]);
    setCitiesFetched(false);
  }, [value.countryId]);

  // Reset cities when state changes
  useEffect(() => {
    setCities([]);
    setCitiesFetched(false);
  }, [value.stateId]);

  const handleCountrySelect = (country: Country) => {
    onChange({
      countryId: country.id,
      stateId: null,
      cityId: null,
      countryName: country.name,
      stateName: "",
      cityName: "",
      latitude: country.latitude,
      longitude: country.longitude,
    });
  };

  const handleStateSelect = (state: State) => {
    onChange({
      ...value,
      stateId: state.id,
      cityId: null,
      stateName: state.name,
      cityName: "",
      latitude: state.latitude || value.latitude,
      longitude: state.longitude || value.longitude,
    });
  };

  const handleCitySelect = (city: City) => {
    onChange({
      ...value,
      cityId: city.id,
      cityName: city.name,
      latitude: city.latitude || value.latitude,
      longitude: city.longitude || value.longitude,
    });
  };

  const handleCountryClear = () => {
    onChange({
      countryId: null,
      stateId: null,
      cityId: null,
      countryName: "",
      stateName: "",
      cityName: "",
      latitude: null,
      longitude: null,
    });
  };

  const handleStateClear = () => {
    onChange({
      ...value,
      stateId: null,
      cityId: null,
      stateName: "",
      cityName: "",
      latitude: countries.find(c => c.id === value.countryId)?.latitude || null,
      longitude: countries.find(c => c.id === value.countryId)?.longitude || null,
    });
  };

  const handleCityClear = () => {
    onChange({
      ...value,
      cityId: null,
      cityName: "",
      latitude: states.find(s => s.id === value.stateId)?.latitude || value.latitude,
      longitude: states.find(s => s.id === value.stateId)?.longitude || value.longitude,
    });
  };

  return (
    <>
      {/* Detect Location Button */}
      {showDetectButton && !disabled && (
        <div className="col-span-full">
          <Button
            type="button"
            variant="outline"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="w-full h-9 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {detectingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Mendeteksi lokasi...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span className="font-medium">Deteksi Lokasi Otomatis</span>
              </>
            )}
          </Button>
        </div>
      )}

      <SearchableSelect
        label="Negara"
        placeholder="Pilih negara..."
        value={{ id: value.countryId, name: value.countryName }}
        options={countries.map(c => ({ id: c.id, name: c.name, emoji: c.emoji, iso2: c.iso2 }))}
        onSearch={() => {}}
        onSelect={(opt) => handleCountrySelect(countries.find(c => c.id === opt.id)!)}
        onClear={handleCountryClear}
        onOpen={fetchCountries}
        loading={loadingCountries}
        disabled={disabled}
        searchQuery=""
        showClearButton={showClearButton}
      />

      <SearchableSelect
        label="Provinsi"
        placeholder={value.countryId ? "Pilih provinsi..." : "Pilih negara dulu"}
        value={{ id: value.stateId, name: value.stateName }}
        options={states.map(s => ({ id: s.id, name: s.name }))}
        onSearch={() => {}}
        onSelect={(opt) => handleStateSelect(states.find(s => s.id === opt.id)!)}
        onClear={handleStateClear}
        onOpen={fetchStates}
        loading={loadingStates}
        disabled={disabled || !value.countryId}
        searchQuery=""
        showClearButton={showClearButton}
      />

      <SearchableSelect
        label="Kota"
        placeholder={value.stateId ? "Pilih kota..." : "Pilih provinsi dulu"}
        value={{ id: value.cityId, name: value.cityName }}
        options={cities.map(c => ({ id: c.id, name: c.name }))}
        onSearch={() => {}}
        onSelect={(opt) => handleCitySelect(cities.find(c => c.id === opt.id)!)}
        onClear={handleCityClear}
        onOpen={fetchCities}
        loading={loadingCities}
        disabled={disabled || !value.stateId}
        searchQuery=""
        showClearButton={showClearButton}
      />
    </>
  );
}

export type { LocationValue };
