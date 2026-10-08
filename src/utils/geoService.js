// Geolocation and Reverse Geocoding Utility for Location-Based Tracking

export const PRESET_LOCATIONS = [
  {
    name: "มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)",
    latitude: 13.8706,
    longitude: 100.5495,
    address: "ถนนประชาชื่น แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร",
    icon: "🏫"
  },
  {
    name: "7-Eleven สาขาหน้า ม.ธุรกิจบัณฑิตย์",
    latitude: 13.8690,
    longitude: 100.5480,
    address: "ซอยประชาชื่น 12 แขวงทุ่งสองห้อง เขตหลักสี่ กทม.",
    icon: "🏪"
  },
  {
    name: "เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน",
    latitude: 13.8596,
    longitude: 100.5431,
    address: "ถนนงามวงศ์วาน ต.บางเขน อ.เมืองนนทบุรี นนทบุรี",
    icon: "🏬"
  },
  {
    name: "สยามพารากอน / สยามสแควร์",
    latitude: 13.7462,
    longitude: 100.5347,
    address: "ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กทม.",
    icon: "🛍️"
  },
  {
    name: "สถานีรถไฟฟ้า BTS หมอชิต / MRT สวนจตุจักร",
    latitude: 13.8024,
    longitude: 100.5538,
    address: "ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กทม.",
    icon: "🚇"
  },
  {
    name: "หอพัก / บ้านพักนักศึกษา",
    latitude: 13.8685,
    longitude: 100.5488,
    address: "ย่านประชาชื่น-งามวงศ์วาน",
    icon: "🏠"
  }
];

/**
 * Get device GPS coordinates using browser Geolocation API
 */
export function getDeviceCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("เบราว์เซอร์นี้ไม่รองรับ Geolocation API"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy)
        });
      },
      (error) => {
        let msg = "ไม่สามารถดึงตำแหน่งได้";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "ผู้ใช้งานปฏิเสธการเข้าถึงพิกัด GPS (โปรดอนุญาต Location ในเบราว์เซอร์)";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "ข้อมูลตำแหน่ง GPS ไม่พร้อมใช้งานในขณะนี้";
            break;
          case error.TIMEOUT:
            msg = "หมดเวลาการค้นหาพิกัด GPS (สัญญาณช้า)";
            break;
          default:
            msg = error.message || msg;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
}

/**
 * Reverse geocode coordinates to human-readable address via OpenStreetMap Nominatim
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=th,en`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "IG342-LocationExpenseTracker/1.0"
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();

    const road = data.address?.road || data.address?.suburb || "";
    const district = data.address?.city_district || data.address?.district || data.address?.county || "";
    const city = data.address?.city || data.address?.province || "";

    const shortName = data.name || [road, district, city].filter(Boolean).join(", ") || "ตำแหน่งที่ระบุ";
    return {
      placeName: shortName,
      fullAddress: data.display_name || ""
    };
  } catch (err) {
    console.debug("Reverse geocoding unavailable:", err);
    return null;
  }
}

/**
 * Generate Google Maps Link from coordinates
 */
export function getGoogleMapsUrl(latitude, longitude) {
  if (!latitude || !longitude) return null;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
