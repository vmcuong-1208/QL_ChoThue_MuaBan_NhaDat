import { Polygon, Marker, InfoWindow, OverlayView } from "@react-google-maps/api";
import PlanningOverlay from "../PlanningOverlay";

const MapPolygonsAndMarkers = ({
  propertyBoundary,
  showBoundaryLayer,
  boundaryOpacity,
  boundaryCenter,
  displayArea,
  selectedBoundaries,
  boundaryOpacities,
  propertyMarkers,
  selectedProperty,
  handlePropertySelect,
  clickMarker,
  mapRef,
  planningData,
  showPlanningLayer,
  planningOpacity,
  measurementPoints,
}) => {
  return (
    <>
      {/* 1. Property Boundary */}
      {propertyBoundary && showBoundaryLayer && (
        <>
          <Polygon
            paths={propertyBoundary}
            options={{
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#FF0000",
              fillOpacity: boundaryOpacity,
            }}
          />
          {propertyBoundary.map((point, idx) => (
            <Marker
              key={`corner-${idx}`}
              position={point}
              label={{
                text: `${idx + 1}`,
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: "12px",
              }}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                fillColor: "#FF0000",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
                scale: 6,
              }}
            />
          ))}
          {boundaryCenter && displayArea && (
            <OverlayView
              position={boundaryCenter}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="p-2 text-lg font-bold transform -translate-x-1/2 -translate-y-1/2 border border-red-500 rounded shadow-sm bg-white/90 whitespace-nowrap backdrop-blur-sm">
                {displayArea.toFixed(2)} m²
              </div>
            </OverlayView>
          )}
        </>
      )}

      {/* 2. Admin Administrative Boundaries */}
      {showBoundaryLayer &&
        selectedBoundaries.map((boundary) => (
          <Polygon
            key={boundary.id}
            paths={boundary.coordinates}
            options={{
              strokeColor: boundary.color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: boundary.color,
              fillOpacity: boundaryOpacities[boundary.id] || 0.5,
            }}
          />
        ))}

      {/* 3. Real Estate Property Markers */}
      {propertyMarkers.map((property) => {
        const isSelected = selectedProperty?.MaTTND === property.MaTTND;
        const lat = Number.parseFloat(property.GPS_Lat || 0);
        const lng = Number.parseFloat(property.GPS_Lng || 0);
        if (!lat || !lng) return null;

        return (
          <Marker
            key={property.MaTTND}
            position={{ lat, lng }}
            onClick={() => handlePropertySelect(property)}
            animation={
              isSelected && window.google?.maps?.Animation?.BOUNCE
                ? window.google.maps.Animation.BOUNCE
                : null
            }
            icon={
              isSelected
                ? {
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    fillColor: "#FF5733",
                    fillOpacity: 1.0,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 3,
                    scale: 12,
                  }
                : {
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    fillColor: "#007BFF",
                    fillOpacity: 0.8,
                    strokeWeight: 1,
                    strokeColor: "#FFFFFF",
                    scale: 8,
                  }
            }
          />
        );
      })}

      {/* 4. Click Marker with InfoWindow */}
      {clickMarker && (
        <Marker
          position={clickMarker}
          icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        >
          <InfoWindow position={clickMarker}>
            <div className="p-1 text-sm">
              <h4 className="font-bold">Điểm được chọn</h4>
              <p className="text-xs">
                {clickMarker.lat.toFixed(6)}, {clickMarker.lng.toFixed(6)}
              </p>
            </div>
          </InfoWindow>
        </Marker>
      )}

      {/* 5. Planning Overlay */}
      <PlanningOverlay
        mapRef={mapRef}
        planningData={planningData}
        showPlanningLayer={showPlanningLayer}
        planningOpacity={planningOpacity}
      />

      {/* 6. Measurement Polygon & Points */}
      {measurementPoints.length > 0 && (
        <>
          <Polygon
            paths={measurementPoints}
            options={{
              strokeColor: "#4285F4",
              strokeOpacity: 1.0,
              strokeWeight: 3,
              fillOpacity: 0,
            }}
          />
          {measurementPoints.map((pt, idx) => (
            <Marker
              key={`measure-${idx}`}
              position={pt}
              label={{ text: `${idx + 1}`, color: "white", fontSize: "12px" }}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                scale: 6,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              }}
            />
          ))}
        </>
      )}
    </>
  );
};

export default MapPolygonsAndMarkers;
