"use client"

import { useState } from "react"
import axios from "axios"

const usePropertyLogic = (mapRef) => {
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [propertyMarkers, setPropertyMarkers] = useState([])
  const [relatedProperties, setRelatedProperties] = useState([])

  // Tìm kiếm BĐS theo Tỉnh/Huyện
  const fetchProperties = async (provinceId, districtId) => {
    if (!provinceId) return

    try {
      const propResponse = await axios.get("http://localhost:5000/api/properties/search", {
        params: {
          tinh: provinceId,
          huyen: districtId,
          limit: 20,
        },
      })
      const properties = propResponse.data.properties || []
      setPropertyMarkers(properties)

      // Logic "BĐS Liên quan" (Client-side filtering)
      // Lấy 5 BĐS đầu tiên làm "liên quan"
      setRelatedProperties(properties.slice(0, 5))

      console.log(`[v0] Found ${properties.length} properties in area.`)
    } catch (err) {
      console.error("[v0] Error fetching properties:", err)
      setPropertyMarkers([])
      setRelatedProperties([])
    }
  }

  const handlePropertySelect = (property) => {
    setSelectedProperty(property)
    if (mapRef.current && property.ToaDoX && property.ToaDoY) {
      mapRef.current.panTo({ lat: property.ToaDoX, lng: property.ToaDoY })
      mapRef.current.setZoom(17)
    }
  }

  return {
    selectedProperty,
    setSelectedProperty,
    propertyMarkers,
    setPropertyMarkers,
    relatedProperties,
    setRelatedProperties,
    fetchProperties,
    handlePropertySelect,
  }
}

export default usePropertyLogic
