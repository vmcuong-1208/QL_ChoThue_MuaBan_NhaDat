"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { calculateDistance } from "../../utils/coordinateConverter";
import { calculatePolygonArea } from "../../utils/gisUtils";
import DirectionsPanel from "./DirectionsPanel";
import NearbyPlacesPanel from "./NearbyPlacesPanel";
import SearchPanel from "../properties/SearchPanel";
import PlaceDetailCard from "./PlaceDetailCard";
import { getPlaceByCoordinates } from "../../utils/nominatimService";
import useGISLogic from "../../hooks/useGISLogic";
import usePropertyLogic from "../../hooks/usePropertyLogic";
import { SERVER_URL } from "../../services/api";

import MapControls from "./google-map/MapControls";
import AdminBoundariesPanel from "./google-map/AdminBoundariesPanel";
import MapPolygonsAndMarkers from "./google-map/MapPolygonsAndMarkers";

const GOOGLE_MAPS_API_KEY = "AIzaSyDhjP2YOGxpCbsp7HatnQXGsKutiIXwmuo";
const libraries = ["drawing", "geometry", "places"];

const GoogleMapComponent = ({
  center = { lat: 10.8231, lng: 106.6297 },
  zoom = 15,
  propertyBoundary = null,
  propertyArea = null,
  planningData = null,
  showControls = true,
  onMapClick = null,
  onBoundaryAdd,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State
  const [propertyCenter, setPropertyCenter] = useState(center);
  const [mapType, setMapType] = useState("roadmap");
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showPlanningLayer, setShowPlanningLayer] = useState(false);
  const [boundaryOpacity, setBoundaryOpacity] = useState(0.5);

  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [measurementDistance, setMeasurementDistance] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [routeData, setRouteData] = useState(null);

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const routePolylineRef = useRef(null);

  const [planningOpacity, setPlanningOpacity] = useState(0.7);
  const [showSearch, setShowSearch] = useState(false);
  const [clickPointMode, setClickPointMode] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetailBoundaries, setPlaceDetailBoundaries] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [clickMarker, setClickMarker] = useState(null);
  const [boundaryCalculatedArea, setBoundaryCalculatedArea] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Custom Hooks
  const {
    selectedBoundaries,
    boundaryOpacities,
    setBoundaryOpacities,
    handleSearchSelect,
    handleRemoveBoundary,
    handleClearAllBoundaries,
    calculatedArea,
    sortedData,
    mapNameToId,
    handleSelectByCoordinates,
    restoreBoundaries,
  } = useGISLogic(mapRef, setPlaceDetailBoundaries);

  const {
    selectedProperty,
    setSelectedProperty,
    propertyMarkers,
    relatedProperties,
    fetchProperties,
    handlePropertySelect,
  } = usePropertyLogic(mapRef);

  const restorePropertyMarkers = useCallback((markersData) => {
    if (!markersData || markersData.length === 0) return;
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setIsMapReady(true);
  }, []);

  useEffect(() => {
    if (propertyBoundary && propertyBoundary.length >= 3 && isLoaded) {
      const area = calculatePolygonArea([propertyBoundary]);
      setBoundaryCalculatedArea(area);
    }
  }, [propertyBoundary, isLoaded]);

  const getPolygonCenter = useCallback((coords) => {
    if (!coords || coords.length === 0) return null;
    let totalLat = 0;
    let totalLng = 0;
    const points = Array.isArray(coords[0]) ? coords.flat() : coords;
    points.forEach((point) => {
      totalLat += point.lat;
      totalLng += point.lng;
    });
    return {
      lat: totalLat / points.length,
      lng: totalLng / points.length,
    };
  }, []);

  const handleSearchCommit = async (query) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&countrycodes=vn&limit=1&addressdetails=1`;
      const response = await fetch(url);
      const data = await response.json();
      const result = data.length > 0 ? data[0] : null;

      if (result) {
        const place = {
          ...result,
          lat: Number.parseFloat(result.lat),
          lng: Number.parseFloat(result.lon || result.lng),
        };
        setSelectedPlace(place);
        setSelectedProperty(null);

        if (mapRef.current) {
          mapRef.current.panTo({ lat: place.lat, lng: place.lng });
          mapRef.current.setZoom(16);
        }

        const queryParts = query
          .split(",")
          .map((part) => part.trim())
          .reverse();
        const levels = [];

        const level1_name = queryParts.shift();
        const level1s = mapNameToId("level1", level1_name, sortedData);
        if (level1s && level1s.length > 0) levels.push(level1s[0]);

        const level1_ids = level1s ? level1s.map((l) => l.id) : [];
        const level2_name = queryParts.length > 0 ? queryParts.shift() : null;
        const level2 =
          level2_name && level1_ids.length > 0
            ? mapNameToId("level2", level2_name, sortedData, { level1_ids })
            : null;
        if (level2) levels.push(level2);

        const level2_ids = level2 ? [level2.id] : [];
        const level3_name = queryParts.length > 0 ? queryParts.shift() : null;
        const level3 =
          level2_ids.length > 0 && level3_name
            ? mapNameToId("level3", level3_name, sortedData, { level2_ids })
            : null;
        if (level3) levels.push(level3);

        await Promise.all(levels.map((level) => handleSearchSelect(level)));
        setPlaceDetailBoundaries(levels);

        const provinceId = level1s && level1s.length > 0 ? level1s[0].id : null;
        const districtId = level2 ? level2.id : null;

        if (provinceId) {
          await fetchProperties(provinceId, districtId);
        }
      } else {
        setSearchError("Không tìm thấy địa điểm.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Lỗi khi tìm kiếm.");
    } finally {
      setSearchLoading(false);
    }
  };

  const processMapClick = useCallback(
    async (lat, lng) => {
      try {
        const placeInfo = await getPlaceByCoordinates(lat, lng);
        const place = {
          ...(placeInfo || {}),
          lat,
          lng,
          display_name:
            placeInfo?.display_name ||
            `Vị trí: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          type: placeInfo?.type || "Selected Location",
        };
        setSelectedPlace(place);
        setSelectedProperty(null);

        const foundBoundaries = await handleSelectByCoordinates(lat, lng);
        if (foundBoundaries && foundBoundaries.length > 0) {
          const province = foundBoundaries.find((b) => b.level === 1);
          const district = foundBoundaries.find((b) => b.level === 2);

          if (province) {
            const provinceId = province.level1_id;
            const districtId = district?.level2_id || null;
            await fetchProperties(provinceId, districtId);
          }
        }
      } catch (err) {
        console.error("processMapClick Error:", err);
      }
    },
    [handleSelectByCoordinates, fetchProperties, setSelectedPlace, setSelectedProperty]
  );

  const handleMapClickOverride = useCallback(
    async (e) => {
      if (e.placeId) {
        e.stop();
        if (measurementMode) {
          const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setMeasurementPoints((prev) => [...prev, newPoint]);
          return;
        }
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setClickMarker({ lat, lng });
        await processMapClick(lat, lng);
        return;
      }

      if (measurementMode) {
        const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMeasurementPoints((prev) => [...prev, newPoint]);
        return;
      }

      if (clickPointMode) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setClickMarker({ lat, lng });
        await processMapClick(lat, lng);
        return;
      }

      if (onMapClick) onMapClick(e);
    },
    [measurementMode, clickPointMode, onMapClick, processMapClick]
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error enabling full-screen mode:", err.message);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (measurementPoints.length > 1) {
      let totalDistance = 0;
      for (let i = 0; i < measurementPoints.length - 1; i++) {
        totalDistance += calculateDistance(
          measurementPoints[i],
          measurementPoints[i + 1]
        );
      }
      setMeasurementDistance(totalDistance);
    } else {
      setMeasurementDistance(0);
    }
  }, [measurementPoints]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    if (routeData && routeData.coordinates) {
      routePolylineRef.current = new window.google.maps.Polyline({
        path: routeData.coordinates,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.9,
        strokeWeight: 5,
        zIndex: 1000,
      });
      routePolylineRef.current.setMap(mapRef.current);
    }
  }, [routeData]);

  // Save map state to localStorage
  useEffect(() => {
    if (clickMarker || selectedPlace || selectedProperty) {
      const mapState = {
        clickMarker,
        selectedPlace,
        selectedProperty,
        placeDetailBoundaries,
        selectedBoundaries: selectedBoundaries.map((b) => ({
          id: b.id,
          name: b.name,
          level: b.level,
          type: b.type,
          color: b.color,
          coordinates: b.coordinates,
          level1_id: b.level1_id,
          level2_id: b.level2_id,
          level3_id: b.level3_id,
        })),
        boundaryOpacities,
        propertyMarkersData: propertyMarkers.map((p) => ({
          MaTTND: p.MaTTND,
          TieuDe: p.TieuDe,
          GPS_Lat: p.GPS_Lat,
          GPS_Lng: p.GPS_Lng,
          Gia: p.Gia,
          DienTich: p.DienTich,
          HinhAnh: p.HinhAnh,
        })),
        relatedPropertiesData: relatedProperties.map((p) => ({
          MaTTND: p.MaTTND,
          TieuDe: p.TieuDe,
          GPS_Lat: p.GPS_Lat,
          GPS_Lng: p.GPS_Lng,
          Gia: p.Gia,
          DienTich: p.DienTich,
          HinhAnh: p.HinhAnh,
        })),
        timestamp: Date.now(),
        mapCenter: {
          lat: mapRef.current?.getCenter()?.lat(),
          lng: mapRef.current?.getCenter()?.lng(),
        },
        mapZoom: mapRef.current?.getZoom(),
      };
      localStorage.setItem("mapState", JSON.stringify(mapState));
    }
  }, [
    clickMarker,
    selectedPlace,
    selectedProperty,
    placeDetailBoundaries,
    selectedBoundaries,
    boundaryOpacities,
    propertyMarkers,
    relatedProperties,
  ]);

  // Restore map state from localStorage
  useEffect(() => {
    if (!isLoaded || !isMapReady || !mapRef.current) return;

    const savedState = localStorage.getItem("mapState");
    if (savedState) {
      try {
        const mapState = JSON.parse(savedState);
        const now = Date.now();
        const AGE_LIMIT = 10 * 60 * 1000;
        const age = now - mapState.timestamp;

        if (age < AGE_LIMIT) {
          if (mapState.mapCenter) mapRef.current.panTo(mapState.mapCenter);
          if (mapState.mapZoom) mapRef.current.setZoom(mapState.mapZoom);
          if (mapState.clickMarker) setClickMarker(mapState.clickMarker);
          if (mapState.selectedPlace) setSelectedPlace(mapState.selectedPlace);
          if (mapState.selectedProperty) setSelectedProperty(mapState.selectedProperty);
          if (mapState.placeDetailBoundaries) setPlaceDetailBoundaries(mapState.placeDetailBoundaries);

          if (mapState.selectedBoundaries && mapState.selectedBoundaries.length > 0) {
            if (typeof restoreBoundaries === "function") {
              restoreBoundaries(mapState.selectedBoundaries);
            }
          }
          if (mapState.boundaryOpacities) setBoundaryOpacities(mapState.boundaryOpacities);
          if (mapState.propertyMarkersData && mapState.propertyMarkersData.length > 0) {
            if (typeof restorePropertyMarkers === "function") {
              restorePropertyMarkers(mapState.propertyMarkersData);
            }
          }
        } else {
          localStorage.removeItem("mapState");
        }
      } catch (err) {
        localStorage.removeItem("mapState");
      }
    }
  }, [isLoaded, isMapReady, restoreBoundaries, restorePropertyMarkers, setBoundaryOpacities, setSelectedProperty]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl animate-fadeIn">
        <div className="p-8 text-center bg-white shadow-2xl rounded-xl">
          <div className="mb-4 text-6xl animate-bounce">⚠️</div>
          <h3 className="mb-2 text-2xl font-bold text-red-600">Lỗi tải bản đồ</h3>
          <p className="text-gray-600">Vui lòng kiểm tra kết nối hoặc API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl animate-fadeIn">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 rounded-full border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-xl font-bold text-gray-700 animate-pulse">
            Đang tải bản đồ...
          </p>
        </div>
      </div>
    );
  }

  const boundaryCenter = propertyBoundary ? getPolygonCenter(propertyBoundary) : null;
  const displayArea = propertyArea || boundaryCalculatedArea;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden transition-all duration-500 bg-white shadow-2xl rounded-2xl ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
      style={{
        height: isFullscreen ? "100vh" : "calc(100vh - 82px)",
        marginTop: isFullscreen ? "0px" : "82px",
      }}
    >
      {/* Control Panel (Top Left) */}
      {showControls && (
        <MapControls
          isFullscreen={isFullscreen}
          mapType={mapType}
          setMapType={setMapType}
          planningData={planningData}
          showPlanningLayer={showPlanningLayer}
          setShowPlanningLayer={setShowPlanningLayer}
          planningOpacity={planningOpacity}
          setPlanningOpacity={setPlanningOpacity}
          propertyBoundary={propertyBoundary}
          showBoundaryLayer={showBoundaryLayer}
          setShowBoundaryLayer={setShowBoundaryLayer}
          boundaryOpacity={boundaryOpacity}
          setBoundaryOpacity={setBoundaryOpacity}
          toggleFullscreen={toggleFullscreen}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          clickPointMode={clickPointMode}
          setClickPointMode={setClickPointMode}
          measurementMode={measurementMode}
          setMeasurementMode={setMeasurementMode}
          measurementPoints={measurementPoints}
          setMeasurementPoints={setMeasurementPoints}
          measurementDistance={measurementDistance}
          setMeasurementDistance={setMeasurementDistance}
          propertyCenter={propertyCenter}
          showDirections={showDirections}
          setShowDirections={setShowDirections}
          showNearbyPlaces={showNearbyPlaces}
          setShowNearbyPlaces={setShowNearbyPlaces}
        />
      )}

      {/* Floating Panels */}
      {showDirections && propertyCenter && (
        <div className="animate-slideInRight">
          <DirectionsPanel
            propertyCenter={propertyCenter}
            mapRef={mapRef}
            onClose={() => {
              setShowDirections(false);
              setRouteData(null);
            }}
            onRouteChange={setRouteData}
          />
        </div>
      )}

      {showNearbyPlaces && propertyCenter && (
        <div className="animate-slideInRight">
          <NearbyPlacesPanel
            propertyCenter={propertyCenter}
            mapRef={mapRef}
            onClose={() => setShowNearbyPlaces(false)}
          />
        </div>
      )}

      {showSearch && (
        <div className="animate-slideInTop">
          <SearchPanel
            onClose={() => setShowSearch(false)}
            onSearchCommit={handleSearchCommit}
            onToggleClickMode={() => setClickPointMode(!clickPointMode)}
            isClickModeActive={clickPointMode}
            onBoundaryAdd={onBoundaryAdd}
            searchLoading={searchLoading}
            searchError={searchError}
          />
        </div>
      )}

      {(selectedPlace || selectedProperty) && (
        <div className="absolute z-20 transform -translate-x-1/2 bottom-4 left-1/2 animate-slideInBottom">
          <PlaceDetailCard
            place={selectedPlace}
            propertySummary={selectedProperty}
            relatedProperties={
              relatedProperties?.map((prop) => {
                const fixImagePath = (imagePath) => {
                  if (!imagePath) return "/placeholder.svg?height=200&width=300";
                  if (typeof imagePath === "string" && imagePath.startsWith("http")) {
                    return imagePath;
                  }
                  return `${SERVER_URL}${imagePath}`;
                };

                let fixedHinhAnh = prop.HinhAnh;
                if (Array.isArray(prop.HinhAnh)) {
                  fixedHinhAnh = prop.HinhAnh.map(fixImagePath);
                } else if (prop.HinhAnh) {
                  fixedHinhAnh = [fixImagePath(prop.HinhAnh)];
                } else {
                  fixedHinhAnh = ["/placeholder.svg?height=200&width=300"];
                }

                return {
                  ...prop,
                  HinhAnh: fixedHinhAnh,
                };
              }) || []
            }
            boundaries={placeDetailBoundaries}
            onClose={() => {
              setSelectedPlace(null);
              setSelectedProperty(null);
              setClickMarker(null);
              setPlaceDetailBoundaries([]);
              localStorage.removeItem("mapState");
            }}
            onBoundaryClick={(boundary) => {
              if (boundary.MaTTND) {
                handlePropertySelect(boundary);
              }
            }}
            calculatedArea={calculatedArea}
            serverUrl={SERVER_URL}
          />
        </div>
      )}

      {/* Google Map Instance */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={propertyCenter}
        zoom={zoom}
        mapTypeId={mapType}
        onClick={handleMapClickOverride}
        onLoad={onLoad}
        options={{
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
          },
          styles:
            mapType === "roadmap"
              ? [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                  },
                ]
              : [],
        }}
      >
        <MapPolygonsAndMarkers
          propertyBoundary={propertyBoundary}
          showBoundaryLayer={showBoundaryLayer}
          boundaryOpacity={boundaryOpacity}
          boundaryCenter={boundaryCenter}
          displayArea={displayArea}
          selectedBoundaries={selectedBoundaries}
          boundaryOpacities={boundaryOpacities}
          propertyMarkers={propertyMarkers}
          selectedProperty={selectedProperty}
          handlePropertySelect={handlePropertySelect}
          clickMarker={clickMarker}
          mapRef={mapRef}
          planningData={planningData}
          showPlanningLayer={showPlanningLayer}
          planningOpacity={planningOpacity}
          measurementPoints={measurementPoints}
        />
      </GoogleMap>

      {/* Admin Boundaries Panel (Bottom Right) */}
      <AdminBoundariesPanel
        selectedBoundaries={selectedBoundaries}
        boundaryOpacities={boundaryOpacities}
        setBoundaryOpacities={setBoundaryOpacities}
        handleRemoveBoundary={handleRemoveBoundary}
        handleClearAllBoundaries={handleClearAllBoundaries}
      />
    </div>
  );
};

export default GoogleMapComponent;
