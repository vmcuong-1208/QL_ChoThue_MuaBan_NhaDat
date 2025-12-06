"use client";

import { useState, useCallback, useEffect } from "react";
import { convertCoordinates, calculatePolygonArea } from "../utils/gisUtils";
import { normalizeVietnamese } from "../utils/textNormalizer";
import { MERGED_TO_OLD_MAP } from "../utils/provinceMapping";
import { findBoundariesContainingPoint } from "../utils/pointInPolygon";

const useGISLogic = (mapRef, setPlaceDetailBoundaries) => {
  const [selectedBoundaries, setSelectedBoundaries] = useState([]);
  const [boundaryOpacities, setBoundaryOpacities] = useState({});
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [sortedData, setSortedData] = useState(null);

  // ✅ NEW: Function để restore boundaries trực tiếp
  const restoreBoundaries = useCallback((boundariesData) => {
    if (Array.isArray(boundariesData) && boundariesData.length > 0) {
      console.log(
        "♻️ [useGISLogic] Restoring boundaries:",
        boundariesData.length
      );
      setSelectedBoundaries(boundariesData);
    }
  }, []);

  // 1. Load Data Effect
  useEffect(() => {
    const loadSortedData = async () => {
      try {
        const response = await fetch("/data/sorted.json");
        const data = await response.json();
        setSortedData(data);
      } catch (err) {
        console.error("[v0] Error loading sorted.json:", err);
      }
    };
    loadSortedData();
  }, []);

  // 2. Các hàm tiện ích nhỏ & State setters
  const handleClearAllBoundaries = useCallback(() => {
    setSelectedBoundaries([]);
    setBoundaryOpacities({});
    setCalculatedArea(0);
  }, []);

  const handleRemoveBoundary = useCallback((id) => {
    setSelectedBoundaries((prev) => prev.filter((b) => b.id !== id));
    setBoundaryOpacities((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const loadAllGISData = useCallback(async () => {
    try {
      const response = await fetch("/data/sorted.json");
      const sorted = await response.json();

      const level1Ids = new Set();
      sorted.forEach((item) => {
        const firstTwoDigits = item[0]?.slice(0, 2);
        if (firstTwoDigits) level1Ids.add(firstTwoDigits);
      });

      const results = [];

      for (const level1Id of Array.from(level1Ids)) {
        try {
          const res = await fetch(`/data/gis/${level1Id}.json`);
          if (res.ok) {
            const gisData = await res.json();
            // Lấy tên romanized
            const romanizedName =
              gisData.romanized ||
              normalizeVietnamese(gisData.name)
                .replace(/\s+/g, "")
                .replace(/^(tinh|thanhpho)/, "")
                .toLowerCase();
            // Thêm level 1 (Tỉnh)
            if (gisData.coordinates) {
              results.push({
                level: 1,
                level1_id: level1Id,
                name: gisData.name,
                romanized: romanizedName,
                type: gisData.type || "MultiPolygon",
                coordinates: gisData.coordinates,
                bbox: gisData.bbox,
              });
            }

            // Thêm level 2 (Huyện)
            if (gisData.level2s) {
              for (const l2 of gisData.level2s) {
                if (l2.coordinates) {
                  results.push({
                    level: 2,
                    level1_id: level1Id,
                    level2_id: l2.level2_id || l2.id,
                    name: l2.name,
                    type: l2.type || "MultiPolygon",
                    coordinates: l2.coordinates,
                    bbox: l2.bbox,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[v0] Could not load GIS ${level1Id}:`, err);
        }
      }

      return results;
    } catch (error) {
      console.error("[v0] Error loading all GIS data:", error);
      return [];
    }
  }, []);

  // 3. Hàm helper load GeoJSON level3
  const loadLevel3sGeoJSON = async (
    level1_id,
    level1NameRomanized,
    level3Name
  ) => {
    try {
      const fileName = `${level1NameRomanized}.json`;
      const response = await fetch(`/data/gis/level3s/${fileName}`);

      if (!response.ok) {
        console.warn(`[v0] Level3s file not found: ${fileName}`);
        return null;
      }

      const geoJSON = await response.json();

      if (geoJSON.features && Array.isArray(geoJSON.features)) {
        const level3NameNormalizedNoSpace = normalizeVietnamese(
          level3Name
        ).replace(/\s+/g, "");

        const matchedFeature = geoJSON.features.find((f) => {
          const properties = f.properties || {};
          const name3 = properties.NAME_3 || "";
          const name3NormalizedNoSpace = normalizeVietnamese(name3).replace(
            /\s+/g,
            ""
          );
          return name3NormalizedNoSpace === level3NameNormalizedNoSpace;
        });

        if (matchedFeature && matchedFeature.geometry) {
          return { geometry: matchedFeature.geometry, matchedFeature };
        }
      }
      return null;
    } catch (err) {
      console.error(
        `[v0] Error loading or parsing Level 3 GeoJSON:`,
        err.message
      );
      return null;
    }
  };
  const findLevel3AtCoordinate = async (level1Romanized, lat, lng) => {
    try {
      const fileName = `${level1Romanized}.json`;
      const response = await fetch(`/data/gis/level3s/${fileName}`);

      if (!response.ok) return null;

      const geoJSON = await response.json();
      if (!geoJSON.features) return null;

      const point = { lat, lng };

      // Duyệt qua từng xã/phường trong file GeoJSON của tỉnh
      for (const feature of geoJSON.features) {
        if (!feature.geometry) continue;

        // QUAN TRỌNG: Dùng tọa độ gốc (GeoJSON Array) để tính toán PIP
        // Không dùng convertCoordinates ở đây vì nó sẽ đổi sang {lat,lng} làm hỏng logic tính toán
        const rawCoordinates = feature.geometry.coordinates;

        const mockGISData = [
          {
            type:
              feature.geometry.type === "Polygon" ? "Polygon" : "MultiPolygon",
            coordinates: rawCoordinates, // <--- Dùng RAW coordinates
            name: feature.properties.NAME_3,
            level: 3,
          },
        ];

        // Hàm này mong đợi coordinates dạng mảng [lng, lat]
        const found = await findBoundariesContainingPoint(point, mockGISData);

        if (found.length > 0) {
          // Khi đã tìm thấy, mới convert sang {lat, lng} để hiển thị lên Google Maps
          const displayCoords = convertCoordinates(rawCoordinates);

          return {
            level: 3,
            name: feature.properties.NAME_3,
            type: feature.geometry.type,
            coordinates: displayCoords,
            level1_id: null,
            level2_id: null,
            bbox: feature.properties.bbox,
          };
        }
      }
      return null;
    } catch (err) {
      console.error("[v0] Error finding Level 3:", err);
      return null;
    }
  };
  // 4. handleSearchSelect
  const handleSearchSelect = useCallback(
    async (result) => {
      try {
        if (!result.level1_id) {
          console.error("[v0] Missing level1_id in result:", result);
          return;
        }

        const level1_id = result.level1_id;
        const gisResponse = await fetch(`/data/gis/${level1_id}.json`);
        if (!gisResponse.ok) {
          console.error("[v0] GIS file not found:", `${level1_id}.json`);
          return;
        }

        const gisData = await gisResponse.json();
        let coords = [];
        let bbox = null;
        let displayName = result.name;
        let level = result.level;

        if (result.level === "level1") {
          const rawCoords = gisData.coordinates || [];
          coords = convertCoordinates(rawCoords);
          bbox = gisData.bbox;
          displayName = gisData.name;
        } else if (result.level === "level2") {
          const searchId = result.level2_id;
          const level2 = gisData.level2s?.find(
            (l2) =>
              l2.level2_id === searchId ||
              l2.id === searchId ||
              l2.internal_id === searchId
          );

          if (level2) {
            const rawCoords = level2.coordinates || [];
            coords = convertCoordinates(rawCoords);
            bbox = level2.bbox;
            displayName = level2.name;
          } else {
            console.warn("[v0] level2_id not found:", searchId);
            return;
          }
        } else if (result.level === "level3") {
          const rawProvinceName = gisData.name.replace(
            /^(Tỉnh|Thành phố)\s*/,
            ""
          );
          const level1NameRomanized =
            gisData.romanized ||
            normalizeVietnamese(rawProvinceName)
              .replace(/\s+/g, "")
              .toLowerCase();

          const level3Data = await loadLevel3sGeoJSON(
            level1_id,
            level1NameRomanized,
            result.name
          );

          if (level3Data && level3Data.geometry) {
            const rawCoords = level3Data.geometry.coordinates;
            coords = convertCoordinates(rawCoords);
            bbox = level3Data.matchedFeature.properties.bbox || gisData.bbox;
            displayName =
              level3Data.matchedFeature.properties.NAME_3 || result.name;
          } else {
            const level2 = gisData.level2s?.find(
              (l2) =>
                l2.level2_id === result.level2_id || l2.id === result.level2_id
            );

            if (level2) {
              const rawCoords = level2.coordinates || [];
              coords = convertCoordinates(rawCoords);
              bbox = level2.bbox;
              displayName = result.name;
              level = "level3_fallback";
            } else {
              return;
            }
          }
        }

        if (coords.length === 0) return;

        const area = calculatePolygonArea(coords);
        setCalculatedArea(area);

        const BRIGHT_COLORS = [
          "#39FF14",
          "#7DF9FF",
          "#FF10F0",
          "#FF6700",
          "#FFFF54",
          "#FF00FF",
          "#00FFAA",
        ];
        const uniqueId = `${result.level}-${result.id}-${Date.now()}`;

        setSelectedBoundaries((prev) => {
          const selectedColor =
            BRIGHT_COLORS[prev.length % BRIGHT_COLORS.length];
          const newBoundary = {
            id: uniqueId,
            level: result.level,
            name: displayName,
            coordinates: coords,
            color: selectedColor,
          };
          return [...prev, newBoundary];
        });

        setBoundaryOpacities((prev) => ({ ...prev, [uniqueId]: 0.5 }));

        if (mapRef.current && bbox && bbox.length === 4) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: bbox[1], lng: bbox[0] });
          bounds.extend({ lat: bbox[3], lng: bbox[2] });
          mapRef.current.fitBounds(bounds);
        }

        return {
          level1_id,
          level2_id: result.level2_id,
          name: displayName,
          area,
        };
      } catch (err) {
        console.error("[v0] handleSearchSelect error:", err);
      }
    },
    [mapRef]
  );

  const handleSelectByCoordinates = useCallback(
    async (lat, lng) => {
      // 1. Tải và tìm Level 1, Level 2
      const allGISData = await loadAllGISData();
      let boundaries = await findBoundariesContainingPoint(
        { lat, lng },
        allGISData
      );

      // 2. LOGIC MỚI: Tìm Level 3
      const foundProvince = boundaries.find((b) => b.level === 1);

      if (foundProvince) {
        // --- ĐOẠN SỬA LỖI QUAN TRỌNG ---
        // Lấy dữ liệu gốc từ allGISData để đảm bảo có tên chính xác
        const sourceData = allGISData.find(
          (d) => d.level === 1 && d.level1_id === foundProvince.level1_id
        );

        let provinceRomanized = null;

        if (sourceData) {
          // 1. Thử lấy romanized có sẵn
          if (sourceData.romanized) {
            provinceRomanized = sourceData.romanized;
          }
          // 2. Nếu không có, TỰ TẠO lại giống hệt logic trong handleSearchSelect
          // (Đây là bước "Tìm theo địa chỉ" làm mà ta đang thiếu)
          else {
            const rawProvinceName = sourceData.name.replace(
              /^(Tỉnh|Thành phố)\s*/,
              ""
            );
            provinceRomanized = normalizeVietnamese(rawProvinceName)
              .replace(/^(tinh|thanhpho)/, "")
              .replace(/\s+/g, "")
              .toLowerCase();
          }
        }

        console.log(
          "[v0] Map Click - Province identified:",
          sourceData?.name,
          "-> Loading file:",
          provinceRomanized
        );

        if (provinceRomanized) {
          // Gọi hàm tìm kiếm với tên file đã được chuẩn hóa chính xác
          const foundLevel3 = await findLevel3AtCoordinate(
            provinceRomanized,
            lat,
            lng
          );

          if (foundLevel3) {
            // Map ID từ cấp cha xuống
            foundLevel3.level1_id = foundProvince.level1_id;
            const foundDistrict = boundaries.find((b) => b.level === 2);
            if (foundDistrict) {
              foundLevel3.level2_id = foundDistrict.level2_id;
            }
            boundaries.push(foundLevel3);
          }
        }
      }

      // --- Phần hiển thị (Giữ nguyên) ---
      if (boundaries && boundaries.length > 0) {
        handleClearAllBoundaries();
        const resultBoundaries = [];

        for (const boundary of boundaries) {
          if (boundary.level === 3) {
            // Logic hiển thị Level 3
            const area = calculatePolygonArea(boundary.coordinates);
            const uniqueId = `level3-${Date.now()}`;
            const BRIGHT_COLORS = [
              "#39FF14",
              "#7DF9FF",
              "#FF10F0",
              "#FF6700",
              "#FFFF54",
            ];

            setSelectedBoundaries((prev) => {
              const selectedColor =
                BRIGHT_COLORS[prev.length % BRIGHT_COLORS.length];
              return [
                ...prev,
                {
                  id: uniqueId,
                  level: 3,
                  name: boundary.name,
                  coordinates: boundary.coordinates,
                  color: selectedColor,
                },
              ];
            });
            setBoundaryOpacities((prev) => ({ ...prev, [uniqueId]: 0.5 }));

            // Ưu tiên hiển thị diện tích xã
            setCalculatedArea(area);

            resultBoundaries.push({
              ...boundary,
              id: boundary.level2_id || boundary.level1_id,
              area,
            });
          } else {
            // Logic hiển thị Level 1, 2 cũ
            const result = await handleSearchSelect({
              level: `level${boundary.level}`,
              level1_id: boundary.level1_id || boundary.level1Id,
              level2_id: boundary.level2_id || boundary.level2Id,
              name: boundary.name,
              id: boundary.level2_id || boundary.level1_id,
            });
            if (result) resultBoundaries.push({ ...boundary, ...result });
          }
        }

        if (setPlaceDetailBoundaries) {
          setPlaceDetailBoundaries(resultBoundaries);
        }
        return resultBoundaries;
      }
      return [];
    },
    [
      loadAllGISData,
      handleClearAllBoundaries,
      handleSearchSelect,
      setPlaceDetailBoundaries,
    ]
  );

  // 6. mapNameToId
  const mapNameToId = useCallback((level, name, sorted_data, context = {}) => {
    if (!sorted_data) return level === "level1" ? [] : null;
    let norm_name = normalizeVietnamese(name)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    norm_name = norm_name.replace(/^(tinh|thanhpho|phuong|xa|quan|huyen)/, "");

    let search_norm_names = [norm_name];
    if (level === "level1" && MERGED_TO_OLD_MAP[norm_name]) {
      search_norm_names = MERGED_TO_OLD_MAP[norm_name];
    }

    if (level === "level1") {
      const results = [];
      for (const search_norm of search_norm_names) {
        for (const l1 of sorted_data) {
          const [l1_id, l1_name] = l1;
          const norm_l1 = normalizeVietnamese(l1_name)
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase()
            .replace(/^(tinh|thanhpho)/, "");
          if (norm_l1 === search_norm || norm_l1.includes(search_norm)) {
            results.push({
              level: "level1",
              name: l1_name,
              id: l1_id,
              level1_id: l1_id,
            });
            break;
          }
        }
      }
      return results;
    }

    if (
      level === "level2" &&
      context.level1_ids &&
      context.level1_ids.length > 0
    ) {
      for (const l1_id of context.level1_ids) {
        const l1 = sorted_data.find(([id]) => id === l1_id);
        if (!l1) continue;

        const [, , , , l2s] = l1;
        for (const l2 of l2s) {
          const [l2_id, l2_name] = l2;
          const norm_l2 = normalizeVietnamese(l2_name)
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase()
            .replace(/^(thanhpho|huyen|quan)/, "");

          if (norm_l2 === norm_name || norm_l2.includes(norm_name)) {
            return {
              level: "level2",
              name: l2_name,
              id: l2_id,
              level1_id: l1_id,
              level2_id: l2_id,
            };
          }
        }
      }
      return null;
    }

    if (
      level === "level3" &&
      context.level2_ids &&
      context.level2_ids.length > 0
    ) {
      for (const l2_id of context.level2_ids) {
        let foundL3 = null;
        for (const l1 of sorted_data) {
          const [, , , , l2s] = l1;
          const l2 = l2s.find(([id]) => id === l2_id);
          if (l2) {
            const [, , , , l3s] = l2;
            for (const l3 of l3s) {
              const [l3_id, l3_name] = l3;
              const norm_l3 = normalizeVietnamese(l3_name)
                .replace(/[^a-zA-Z0-9]/g, "")
                .toLowerCase()
                .replace(/^(phuong|xa)/, "");

              if (norm_l3 === norm_name || norm_l3.includes(norm_name)) {
                foundL3 = {
                  level: "level3",
                  name: l3_name,
                  id: l3_id,
                  level1_id: l1[0],
                  level2_id: l2_id,
                };
                break;
              }
            }
            if (foundL3) return foundL3;
          }
        }
      }
      return null;
    }

    return null;
  }, []);

  return {
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
  };
};

export default useGISLogic;
