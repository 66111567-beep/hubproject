// IndexedDB Service for Location-Based Expense & Income Tracker
// Pure native IndexedDB with Promise wrapper (Zero dependencies, 100% offline support)

const DB_NAME = "IG342_ExpenseTrackerDB";
const DB_VERSION = 1;
const STORE_NAME = "transactions";

/**
 * Open and initialize the IndexedDB database
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        // Create indexes for efficient searching & filtering
        store.createIndex("type", "type", { unique: false });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("locationName", "location.name", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Retrieve all transactions from IndexedDB
 */
export async function getAllTransactions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort newest to oldest
      const items = (request.result || []).sort(
        (a, b) => new Date(b.date + "T" + (b.time || "00:00")) - new Date(a.date + "T" + (a.time || "00:00"))
      );
      resolve(items);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Add a new transaction record
 */
export async function addTransaction(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id: item.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: item.type || "expense", // 'expense' or 'income'
      title: item.title?.trim() || "ไม่ระบุชื่อรายการ",
      amount: Number(item.amount) || 0,
      category: item.category || "อื่นๆ",
      date: item.date || new Date().toISOString().split("T")[0],
      time: item.time || new Date().toTimeString().slice(0, 5),
      note: item.note?.trim() || "",
      location: {
        name: item.location?.name?.trim() || "ไม่ระบุตำแหน่ง",
        latitude: item.location?.latitude ?? null,
        longitude: item.location?.longitude ?? null,
        accuracy: item.location?.accuracy ?? null,
        address: item.location?.address ?? ""
      },
      createdAt: new Date().toISOString()
    };

    const request = store.add(record);
    request.onsuccess = () => resolve(record);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Update an existing transaction record
 */
export async function updateTransaction(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Clear all records in IndexedDB
 */
export async function clearAllTransactions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Seed realistic sample data (specifically around DPU / Bangkok student lifestyle)
 */
export async function seedSampleTransactions() {
  const today = new Date();
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split("T")[0];
  };

  const sampleData = [
    {
      id: "sample_1",
      type: "income",
      title: "ผู้ปกครองโอนเงินค่าใช้จ่ายประจำเดือน",
      amount: 9000,
      category: "เงินเดือน / ผู้ปกครอง",
      date: formatDate(4),
      time: "09:30",
      note: "เงินสำหรับค่าใช้จ่ายและค่าหอเดือนนี้",
      location: {
        name: "หอพักนักศึกษา ประชาชื่น",
        latitude: 13.8685,
        longitude: 100.5488,
        accuracy: 10,
        address: "ซอยประชาชื่น 12 แขวงทุ่งสองห้อง เขตหลักสี่ กทม."
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "sample_2",
      type: "expense",
      title: "ข้าวกะเพราหมูกรอบไข่ดาว + น้ำเก๊กฮวย",
      amount: 65,
      category: "อาหาร & เครื่องดื่ม",
      date: formatDate(0),
      time: "12:15",
      note: "โรงอาหารกลาง ม.ธุรกิจบัณฑิตย์",
      location: {
        name: "มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)",
        latitude: 13.8706,
        longitude: 100.5495,
        accuracy: 5,
        address: "โรงอาหารกลาง อาคาร 7 DPU"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "sample_3",
      type: "expense",
      title: "กาแฟ Iced Americano + ขนมปังปิ้ง",
      amount: 80,
      category: "อาหาร & เครื่องดื่ม",
      date: formatDate(0),
      time: "14:40",
      note: "นั่งอ่านสไลด์วิชา IG342 เตรียมพรีเซนต์",
      location: {
        name: "Café Amazon หน้า ม.ธุรกิจบัณฑิตย์",
        latitude: 13.8712,
        longitude: 100.5501,
        accuracy: 8,
        address: "หน้าประตูใหญ่ DPU ถนนประชาชื่น"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "sample_4",
      type: "expense",
      title: "ค่ารถไฟฟ้า BTS เดินทางไปสยาม",
      amount: 47,
      category: "เดินทาง & ขนส่ง",
      date: formatDate(1),
      time: "16:20",
      note: "สถานีหมอชิต ไป สถานีสยาม",
      location: {
        name: "BTS สถานีหมอชิต",
        latitude: 13.8024,
        longitude: 100.5538,
        accuracy: 12,
        address: "BTS หมอชิต ถนนพหลโยธิน จตุจักร กทม."
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "sample_5",
      type: "expense",
      title: "หนังสือคู่มือ React 19 & พัฒนา Mobile App",
      amount: 320,
      category: "การศึกษา & ตำรา",
      date: formatDate(1),
      time: "18:00",
      note: "ร้านซีเอ็ดบุ๊คเซ็นเตอร์ ซื้อไว้อ่านประกอบวิชา",
      location: {
        name: "เดอะมอลล์ งามวงศ์วาน",
        latitude: 13.8596,
        longitude: 100.5431,
        accuracy: 15,
        address: "ชั้น 3 เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "sample_6",
      type: "income",
      title: "รับจ้างสอนพิเศษเขียนโค้ดน้องมัธยม",
      amount: 1500,
      category: "งานพาร์ทไทม์ / ฟรีแลนซ์",
      date: formatDate(2),
      time: "17:00",
      note: "สอนเขียนเว็บ HTML/CSS/JavaScript 2 ชั่วโมง",
      location: {
        name: "สยามพารากอน / สยามสแควร์",
        latitude: 13.7462,
        longitude: 100.5347,
        accuracy: 6,
        address: "Co-working Space สยามสแควร์วัน"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "sample_7",
      type: "expense",
      title: "ซื้อของใช้ส่วนตัวและของกินตุน",
      amount: 245,
      category: "ช้อปปิ้ง & ของใช้",
      date: formatDate(3),
      time: "21:10",
      note: "สบู่ ยาสระผม บะหมี่กึ่งสำเร็จรูป นมจืด",
      location: {
        name: "7-Eleven สาขาหน้าหอพัก ประชาชื่น",
        latitude: 13.8690,
        longitude: 100.5480,
        accuracy: 5,
        address: "ปากซอยประชาชื่น 12 แขวงทุ่งสองห้อง"
      },
      createdAt: new Date().toISOString()
    }
  ];

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing sample first or append
    sampleData.forEach((item) => store.put(item));

    transaction.oncomplete = () => resolve(sampleData);
    transaction.onerror = (e) => reject(e.target.error);
  });
}
