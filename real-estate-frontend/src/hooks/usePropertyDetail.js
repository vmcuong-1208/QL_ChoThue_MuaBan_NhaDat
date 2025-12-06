import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import locationService from "../services/locationService";
import { loadPlanningData } from "../utils/planningDataLoader";

export const usePropertyDetail = (id, currentUser, navigate) => {
  const [property, setProperty] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [locationNames, setLocationNames] = useState({});
  const [planningData, setPlanningData] = useState(null);
  const [mapCoordinates, setMapCoordinates] = useState({
    lat: 10.8231,
    lng: 106.6297,
  });

  const fetchLocationNames = async (propData) => {
    try {
      const locationNamesObj = {};
      if (propData.MaTinh) {
        const provinces = await locationService.getProvinces();
        const province = provinces.find(
          (p) => p.MaTinh === parseInt(propData.MaTinh)
        );
        if (province) {
          locationNamesObj.province = province.TenTinh;
          if (propData.MaHuyen) {
            const districts = await locationService.getDistricts(propData.MaTinh);
            const district = districts.find(
              (d) => d.MaHuyen === parseInt(propData.MaHuyen)
            );
            if (district) {
              locationNamesObj.district = district.TenHuyen;
              if (propData.MaXa) {
                const wards = await locationService.getWards(propData.MaHuyen);
                const ward = wards.find(
                  (w) => w.MaXa === parseInt(propData.MaXa)
                );
                if (ward) locationNamesObj.ward = ward.TenXa;
              }
            }
          }
        }
      }
      setLocationNames(locationNamesObj);
      return locationNamesObj;
    } catch (err) {
      console.error("Lỗi khi lấy thông tin địa điểm:", err);
      return {};
    }
  };

  useEffect(() => {
    const fetchPropertyDetail = async () => {
      if (!id) {
        setError("Không tìm thấy ID bất động sản");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/properties/${id}`);

        if (!response.data) {
          setError("Không tìm thấy thông tin bất động sản");
          setLoading(false);
          return;
        }

        const propData = response.data;
        setProperty(propData);

        if (propData.ToaDoVN2000) {
          try {
            if (typeof propData.ToaDoVN2000 === "string") {
              propData.ToaDoVN2000 = JSON.parse(propData.ToaDoVN2000);
            }
          } catch (e) {
            console.error("Error parsing ToaDoVN2000:", e);
          }
        }

        if (propData.GPS_Lat && propData.GPS_Lng) {
          setMapCoordinates({
            lat: parseFloat(propData.GPS_Lat),
            lng: parseFloat(propData.GPS_Lng),
          });
        } else if (propData.ToaDoVN2000?.wgs84Coordinates?.length > 0) {
          setMapCoordinates(propData.ToaDoVN2000.wgs84Coordinates[0]);
        }

        // Fetch seller details
        if (propData.MaNgDung) {
          try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const sellerResponse = await axios.get(
              `${API_URL}/users/${propData.MaNgDung}`,
              { headers }
            );

            if (sellerResponse.data.MaNgDung !== currentUser?.MaNgDung) {
              setSeller(sellerResponse.data);
            } else {
              setSeller({
                ...sellerResponse.data,
                HoTen: sellerResponse.data.HoTen + " (Bạn)",
              });
            }
          } catch (err) {
            console.error("Lỗi khi lấy thông tin người bán:", err);
          }
        }

        // Load location names and planning data
        const locationData = await fetchLocationNames(propData);
        if (locationData.province && locationData.district) {
          const planning = await loadPlanningData(
            locationData.province,
            locationData.district
          );
          setPlanningData(planning);
        } else {
          setPlanningData(null);
        }

        setLoading(false);

        // View history
        if (currentUser) {
          try {
            const token = localStorage.getItem("token");
            await axios.post(
              `${API_URL}/recommendations/view-history`,
              { propertyId: id },
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
              }
            );
          } catch (err) {
            console.warn("View history logging skipped:", err.message);
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết BĐS:", err);
        setError("Không thể tải thông tin bất động sản");
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id, currentUser]);

  // Check favorite status
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !id) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/favorites/check/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(response.data.isFavorite);
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };
    checkFavoriteStatus();
  }, [id, currentUser]);

  const toggleFavorite = useCallback(async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(false);
      } else {
        await axios.post(
          `${API_URL}/favorites/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  }, [id, currentUser, isFavorite, navigate]);

  return {
    property,
    seller,
    loading,
    error,
    isFavorite,
    locationNames,
    mapCoordinates,
    planningData,
    toggleFavorite,
  };
};

export default usePropertyDetail;
