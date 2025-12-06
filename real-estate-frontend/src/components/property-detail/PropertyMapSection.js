import { FaMapMarkerAlt } from "react-icons/fa";
import GoogleMapComponent from "../GoogleMapComponent";

const PropertyMapSection = ({
  property,
  fullAddress,
  boundary,
  area,
  planningData,
}) => {
  if (!property) return null;

  const calculateMapCenter = () => {
    if (boundary && boundary.length > 0) {
      return boundary[0];
    }
    const lat = Number(property.GPS_Lat || property.ToaDoX || 10.8231);
    const lng = Number(property.GPS_Lng || property.ToaDoY || 106.6297);

    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      lat !== 0 &&
      lng !== 0
    ) {
      return { lat, lng };
    }
    return { lat: 10.8231, lng: 106.6297 };
  };

  const center = calculateMapCenter();
  const zoom = property.ToaDoVN2000?.wgs84Coordinates ? 18 : 15;

  return (
    <div className="p-6 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp">
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        Vị trí trên bản đồ
      </h2>
      <div className="overflow-hidden rounded-lg">
        <GoogleMapComponent
          center={center}
          zoom={zoom}
          propertyBoundary={boundary}
          propertyArea={area}
          planningData={planningData}
          height="500px"
          showControls={true}
          showMode="property"
          propertyProvince={property.MaTinh}
          propertyDistrict={property.MaHuyen}
        />
      </div>
      <p className="flex items-center gap-2 mt-4 text-sm text-gray-600">
        <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
        <span>{fullAddress}</span>
      </p>
    </div>
  );
};

export default PropertyMapSection;
