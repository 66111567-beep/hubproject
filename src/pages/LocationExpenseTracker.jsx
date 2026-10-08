import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getAllTransactions,
  addTransaction,
  deleteTransaction,
  clearAllTransactions,
  seedSampleTransactions
} from "../utils/indexedDB";
import {
  getDeviceCoordinates,
  reverseGeocode,
  getGoogleMapsUrl,
  PRESET_LOCATIONS
} from "../utils/geoService";
import { sounds } from "../utils/soundEffects";

const CATEGORIES = {
  expense: [
    { id: "อาหาร & เครื่องดื่ม", icon: "🍜", color: "from-amber-500 to-orange-500" },
    { id: "เดินทาง & ขนส่ง", icon: "🚌", color: "from-blue-500 to-cyan-500" },
    { id: "ช้อปปิ้ง & ของใช้", icon: "🛍️", color: "from-pink-500 to-rose-500" },
    { id: "ความบันเทิง & สันทนาการ", icon: "🎮", color: "from-purple-500 to-indigo-500" },
    { id: "ค่าหอพัก & บิล", icon: "🏠", color: "from-emerald-500 to-teal-500" },
    { id: "การศึกษา & ตำรา", icon: "📚", color: "from-sky-500 to-blue-600" },
    { id: "สุขภาพ & ยา", icon: "💊", color: "from-red-500 to-rose-600" },
    { id: "อื่นๆ", icon: "📦", color: "from-gray-500 to-slate-600" }
  ],
  income: [
    { id: "เงินเดือน / ผู้ปกครอง", icon: "👨‍👩‍👧", color: "from-emerald-500 to-green-600" },
    { id: "งานพาร์ทไทม์ / ฟรีแลนซ์", icon: "💼", color: "from-teal-500 to-cyan-600" },
    { id: "ขายของออนไลน์", icon: "📦", color: "from-indigo-500 to-blue-600" },
    { id: "โบนัส / เงินรางวัล", icon: "🏆", color: "from-amber-500 to-yellow-500" },
    { id: "อื่นๆ", icon: "💰", color: "from-gray-500 to-slate-600" }
  ]
};

export default function LocationExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("records"); // records, locations, categories
  const [toastMessage, setToastMessage] = useState(null);

  // Filter States
  const [filterType, setFilterType] = useState("all"); // all, income, expense
  const [filterPeriod, setFilterPeriod] = useState("all"); // all, today, 7days, thismonth
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");

  // Form State
  const [formType, setFormType] = useState("expense");
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("อาหาร & เครื่องดื่ม");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTime, setFormTime] = useState(new Date().toTimeString().slice(0, 5));
  const [formNote, setFormNote] = useState("");
  const [formLocationName, setFormLocationName] = useState("");
  const [formLatitude, setFormLatitude] = useState(null);
  const [formLongitude, setFormLongitude] = useState(null);
  const [formAccuracy, setFormAccuracy] = useState(null);
  const [formAddress, setFormAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  const fileInputRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Load transactions from IndexedDB
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
      if (data.length === 0) {
        // Automatically seed sample data if empty so the screen isn't blank
        const seeded = await seedSampleTransactions();
        setTransactions(seeded);
      }
    } catch (err) {
      console.error("Failed to load IndexedDB data:", err);
      showToast("⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูล IndexedDB", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // GPS Auto-detect handler
  const handleFetchGPS = async () => {
    setIsLocating(true);
    setLocationStatus("กำลังค้นหาสัญญาณ GPS จากอุปกรณ์...");
    sounds.playTone(600, "sine", 0.08, 0.08);

    try {
      const coords = await getDeviceCoordinates();
      setFormLatitude(coords.latitude);
      setFormLongitude(coords.longitude);
      setFormAccuracy(coords.accuracy);
      setLocationStatus(`พบพิกัดแล้ว! ความแม่นยำ ±${coords.accuracy} ม.`);

      // Attempt reverse geocoding
      setLocationStatus("กำลังดึงชื่อสถานที่จากพิกัด...");
      const geoInfo = await reverseGeocode(coords.latitude, coords.longitude);
      if (geoInfo) {
        if (!formLocationName || formLocationName.trim() === "") {
          setFormLocationName(geoInfo.placeName);
        }
        setFormAddress(geoInfo.fullAddress);
        setLocationStatus(`ระบุตำแหน่งเรียบร้อย: ${geoInfo.placeName}`);
      } else {
        if (!formLocationName) {
          setFormLocationName(`พิกัด (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
        }
        setLocationStatus(`ระบุพิกัดสำเร็จ (±${coords.accuracy}m)`);
      }
      sounds.cardMatch();
    } catch (err) {
      setLocationStatus(`❌ ${err.message}`);
      sounds.wrong();
    } finally {
      setIsLocating(false);
    }
  };

  // Set Preset Location
  const handleSelectPreset = (preset) => {
    sounds.playTone(520, "sine", 0.05, 0.05);
    setFormLocationName(preset.name);
    setFormLatitude(preset.latitude);
    setFormLongitude(preset.longitude);
    setFormAccuracy(5);
    setFormAddress(preset.address);
    setLocationStatus(`เลือกสถานที่: ${preset.name}`);
  };

  // Reset Form
  const resetForm = () => {
    setFormTitle("");
    setFormAmount("");
    setFormCategory(formType === "expense" ? "อาหาร & เครื่องดื่ม" : "เงินเดือน / ผู้ปกครอง");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormTime(new Date().toTimeString().slice(0, 5));
    setFormNote("");
    setFormLocationName("");
    setFormLatitude(null);
    setFormLongitude(null);
    setFormAccuracy(null);
    setFormAddress("");
    setLocationStatus("");
  };

  // Add Transaction
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("กรุณาระบุจำนวนเงินที่ถูกต้อง", "error");
      sounds.wrong();
      return;
    }

    if (!formTitle.trim()) {
      showToast("กรุณาระบุชื่อรายการ", "error");
      sounds.wrong();
      return;
    }

    try {
      const newRecord = {
        type: formType,
        title: formTitle,
        amount: amountNum,
        category: formCategory,
        date: formDate,
        time: formTime,
        note: formNote,
        location: {
          name: formLocationName.trim() || "ไม่ระบุพิกัด",
          latitude: formLatitude,
          longitude: formLongitude,
          accuracy: formAccuracy,
          address: formAddress
        }
      };

      await addTransaction(newRecord);
      sounds.victory();
      showToast(`บันทึก ${formType === "income" ? "รายรับ" : "รายจ่าย"} ฿${amountNum.toLocaleString()} สำเร็จ!`);
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
      sounds.wrong();
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id, title) => {
    if (window.confirm(`ต้องการลบรายการ "${title}" หรือไม่?`)) {
      try {
        await deleteTransaction(id);
        sounds.playTone(280, "sawtooth", 0.1, 0.08);
        showToast("ลบรายการเรียบร้อย", "info");
        loadData();
      } catch (err) {
        console.error(err);
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
      }
    }
  };

  // Clear All Data
  const handleClearAll = async () => {
    if (window.confirm("คำเตือน: คุณต้องการล้างข้อมูลบันทึกทั้งหมดใน IndexedDB หรือไม่?")) {
      await clearAllTransactions();
      sounds.wrong();
      showToast("ล้างข้อมูลใน IndexedDB เรียบร้อย", "info");
      loadData();
    }
  };

  // Seed Sample Data
  const handleLoadSample = async () => {
    await seedSampleTransactions();
    sounds.cardMatch();
    showToast("โหลดข้อมูลตัวอย่างสำเร็จ! (DPU, เซเว่น, สยาม, เดอะมอลล์)", "success");
    loadData();
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `IG342_Expense_Backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sounds.playTone(800, "sine", 0.1, 0.1);
    showToast("ส่งออกข้อมูลเป็นไฟล์ JSON เรียบร้อย!");
  };

  // Import JSON file
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            await addTransaction(item);
          }
          sounds.victory();
          showToast(`นำเข้าข้อมูลสำเร็จ ${parsed.length} รายการ!`);
          loadData();
        } else {
          showToast("รูปแบบไฟล์ JSON ไม่ถูกต้อง", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("ไฟล์ JSON เสียหายหรือไม่ถูกต้อง", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Financial Calculations & Analytics ---
  const calculations = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    const categoryMap = {};
    const locationMap = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        totalIncome += amt;
      } else {
        totalExpense += amt;

        // Group expense by category
        const cat = tx.category || "อื่นๆ";
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;

        // Group expense by location
        const loc = tx.location?.name || "ไม่ระบุตำแหน่ง";
        if (!locationMap[loc]) {
          locationMap[loc] = {
            name: loc,
            total: 0,
            count: 0,
            latitude: tx.location?.latitude,
            longitude: tx.location?.longitude
          };
        }
        locationMap[loc].total += amt;
        locationMap[loc].count += 1;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;
    const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 100;
    const expenseTxCount = transactions.filter((t) => t.type === "expense").length;
    const avgExpense = expenseTxCount > 0 ? Math.round(totalExpense / expenseTxCount) : 0;

    // Sort locations by highest spend
    const sortedLocations = Object.values(locationMap).sort((a, b) => b.total - a.total);

    // Sort categories by highest spend
    const sortedCategories = Object.entries(categoryMap)
      .map(([name, sum]) => ({
        name,
        amount: sum,
        percent: totalExpense > 0 ? ((sum / totalExpense) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      expenseRatio,
      avgExpense,
      sortedLocations,
      sortedCategories
    };
  }, [transactions]);

  // --- Filtered Transactions for Table/List ---
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return transactions.filter((tx) => {
      // Type Filter
      if (filterType !== "all" && tx.type !== filterType) return false;

      // Period Filter
      if (filterPeriod === "today" && tx.date !== todayStr) return false;
      if (filterPeriod === "7days") {
        const txDate = new Date(tx.date);
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      }
      if (filterPeriod === "thismonth") {
        const txMonth = tx.date?.substring(0, 7);
        const curMonth = todayStr.substring(0, 7);
        if (txMonth !== curMonth) return false;
      }

      // Location Filter
      if (selectedLocationFilter !== "all") {
        if (tx.location?.name !== selectedLocationFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tx.title?.toLowerCase().includes(q);
        const matchCat = tx.category?.toLowerCase().includes(q);
        const matchLoc = tx.location?.name?.toLowerCase().includes(q);
        const matchNote = tx.note?.toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchLoc && !matchNote) return false;
      }

      return true;
    });
  }, [transactions, filterType, filterPeriod, selectedLocationFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center px-4 py-3 rounded-xl shadow-2xl text-white font-medium text-sm transition-all transform animate-bounce ${
            toastMessage.type === "error"
              ? "bg-rose-600 border border-rose-400"
              : toastMessage.type === "info"
              ? "bg-slate-800 border border-slate-700"
              : "bg-emerald-600 border border-emerald-400"
          }`}
        >
          <span className="mr-2 text-lg">
            {toastMessage.type === "error" ? "❌" : toastMessage.type === "info" ? "ℹ️" : "✅"}
          </span>
          {toastMessage.text}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <span>📍 GPS Location & IndexedDB</span>
              <span>•</span>
              <span>PWA Offline 100%</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              ระบบบันทึกรายรับ-รายจ่ายตามพิกัดสถานที่
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl font-light">
              จัดเก็บข้อมูลออฟไลน์ผ่าน <strong className="text-indigo-300 font-semibold">IndexedDB</strong> พร้อมเชื่อมโยงพิกัด GPS Geolocation และคำนวณสถิติทางการเงิน วิเคราะห์สถานที่ที่ใช้จ่ายมากที่สุด
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                sounds.cardFlip();
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-lg">➕</span>
              <span>บันทึกรายการ</span>
            </button>

            <button
              onClick={handleLoadSample}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
              title="โหลดข้อมูลตัวอย่าง เช่น DPU, สยาม, 7-Eleven"
            >
              <span>🎲</span>
              <span>ตัวอย่าง (Demo)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
              title="สำรองข้อมูลเป็น JSON"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
              title="กู้คืนข้อมูลจาก JSON"
            >
              <span>📤</span>
              <span className="hidden sm:inline">Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleClearAll}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition"
              title="ล้างข้อมูลทั้งหมดใน IndexedDB"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* KPI Calculation Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              รายรับทั้งหมด
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              💰
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{calculations.totalIncome.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>จำนวน {transactions.filter((t) => t.type === "income").length} รายการ</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              รายจ่ายทั้งหมด
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
              💸
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{calculations.totalExpense.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>เฉลี่ย/รายการ: ฿{calculations.avgExpense.toLocaleString()}</span>
            <span className="text-rose-500 font-semibold">{calculations.expenseRatio}% ของรายรับ</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
        </div>

        {/* Net Balance Card */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              ยอดคงเหลือสุทธิ
            </span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              ⚖️
            </span>
          </div>
          <div
            className={`text-2xl font-bold ${
              calculations.netBalance >= 0 ? "text-indigo-600" : "text-rose-600"
            }`}
          >
            {calculations.netBalance < 0 ? "-" : ""}฿
            {Math.abs(calculations.netBalance).toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">สถานะกระเป๋าเงิน:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                calculations.netBalance >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {calculations.netBalance >= 0 ? "มีเงินออมเหลือ" : "ใช้เกินรายรับ"}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
        </div>

        {/* Location Spot Card */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              สถานที่ใช้เงินสูงสุด
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              📍
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 truncate" title={calculations.sortedLocations[0]?.name}>
            {calculations.sortedLocations[0]?.name || "ยังไม่มีข้อมูล"}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>ใช้ไป: ฿{(calculations.sortedLocations[0]?.total || 0).toLocaleString()}</span>
            <span className="text-amber-600 font-semibold">
              {calculations.sortedLocations[0]?.count || 0} ครั้ง
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-gray-200 p-3 sm:px-6 bg-slate-50/60">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => {
                sounds.playTone(450, "sine", 0.05, 0.05);
                setActiveTab("records");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === "records"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              📋 ประวัติรายการ ({filteredTransactions.length})
            </button>

            <button
              onClick={() => {
                sounds.playTone(480, "sine", 0.05, 0.05);
                setActiveTab("locations");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === "locations"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              🗺️ สรุปตามพิกัดสถานที่ ({calculations.sortedLocations.length})
            </button>

            <button
              onClick={() => {
                sounds.playTone(510, "sine", 0.05, 0.05);
                setActiveTab("categories");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === "categories"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              📊 สรุปแยกหมวดหมู่
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-2 sm:mt-0 font-medium">
            ฐานข้อมูล: <span className="text-indigo-600 font-bold">IndexedDB</span> (ออฟไลน์)
          </div>
        </div>

        {/* Tab 1: Transaction Records List */}
        {activeTab === "records" && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-gray-200">
              {/* Type Filter */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === "all" ? "bg-slate-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setFilterType("expense")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === "expense"
                      ? "bg-rose-500 text-white"
                      : "bg-white text-rose-600 hover:bg-rose-50"
                  }`}
                >
                  รายจ่าย
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === "income"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  รายรับ
                </button>
              </div>

              {/* Period Filter */}
              <div className="flex items-center space-x-1.5">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">ช่วงเวลา: ทั้งหมด</option>
                  <option value="today">วันนี้</option>
                  <option value="7days">7 วันล่าสุด</option>
                  <option value="thismonth">เดือนนี้</option>
                </select>

                {/* Location Filter Dropdown */}
                <select
                  value={selectedLocationFilter}
                  onChange={(e) => setSelectedLocationFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[150px] truncate"
                >
                  <option value="all">สถานที่: ทั้งหมด</option>
                  {calculations.sortedLocations.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="w-full sm:w-64">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, หมวด, สถานที่..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction List */}
            {isLoading ? (
              <div className="py-12 text-center text-gray-400">
                <div className="inline-block animate-spin text-3xl mb-2">🔄</div>
                <p className="text-sm">กำลังโหลดข้อมูลจาก IndexedDB...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-base font-semibold text-gray-600">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรอง หรือกดปุ่ม "บันทึกรายการ" เพื่อเพิ่มข้อมูลใหม่</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTransactions.map((tx) => {
                  const isExpense = tx.type === "expense";
                  const mapsUrl = getGoogleMapsUrl(tx.location?.latitude, tx.location?.longitude);

                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all bg-white shadow-xs group"
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-start space-x-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            isExpense
                              ? "bg-rose-50 text-rose-500 border border-rose-100"
                              : "bg-emerald-50 text-emerald-500 border border-emerald-100"
                          }`}
                        >
                          {isExpense ? "💸" : "💰"}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-indigo-600 transition">
                              {tx.title}
                            </h3>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isExpense
                                  ? "bg-rose-100/70 text-rose-700"
                                  : "bg-emerald-100/70 text-emerald-700"
                              }`}
                            >
                              {tx.category}
                            </span>
                          </div>

                          {/* Location Pin & Date */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>
                                {tx.date} • {tx.time || "00:00"}
                              </span>
                            </span>

                            {/* Location Display */}
                            <span className="flex items-center space-x-1 text-slate-700 font-medium">
                              <span>📍</span>
                              <span className="max-w-[180px] sm:max-w-xs truncate" title={tx.location?.address}>
                                {tx.location?.name || "ไม่ระบุตำแหน่ง"}
                              </span>
                            </span>

                            {/* GPS Badge & Google Maps Link */}
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-medium"
                                title={`พิกัด GPS: ${tx.location.latitude}, ${tx.location.longitude}`}
                              >
                                <span>🗺️ เปิดแผนที่</span>
                              </a>
                            )}
                          </div>

                          {tx.note && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              "{tx.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Delete Button */}
                      <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end sm:space-x-4">
                        <div className="text-right">
                          <span
                            className={`text-base sm:text-lg font-extrabold ${
                              isExpense ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {isExpense ? "-" : "+"}฿{Number(tx.amount).toLocaleString()}
                          </span>
                          <div className="text-[10px] text-gray-400">
                            {isExpense ? "รายจ่าย" : "รายรับ"}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTransaction(tx.id, tx.title)}
                          className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="ลบรายการนี้"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Location Breakdown Analysis */}
        {activeTab === "locations" && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                🗺️ วิเคราะห์การใช้จ่ายแยกตามสถานที่ (Location Intelligence)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                จัดอันดับพิกัดสถานที่ที่มีการใช้เงินสูงสุด พร้อมจำนวนครั้งและลิงก์เปิด Google Maps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calculations.sortedLocations.map((loc, idx) => {
                const mapsUrl = getGoogleMapsUrl(loc.latitude, loc.longitude);
                const percentOfTotal =
                  calculations.totalExpense > 0
                    ? ((loc.total / calculations.totalExpense) * 100).toFixed(1)
                    : 0;

                return (
                  <div
                    key={loc.name}
                    className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md transition relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-700 border border-amber-300"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition truncate max-w-[170px]" title={loc.name}>
                            {loc.name}
                          </h3>
                          <span className="text-[11px] text-gray-400">
                            เข้าใช้ {loc.count} ครั้ง
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-rose-600">
                          ฿{loc.total.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {percentOfTotal}% ของรายจ่าย
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setSelectedLocationFilter(loc.name);
                          setActiveTab("records");
                          sounds.playTone(450, "sine", 0.05, 0.05);
                        }}
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        ดูรายการทั้งหมดที่นี่ →
                      </button>

                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 text-slate-600 hover:text-blue-600"
                        >
                          <span>🗺️ Google Maps</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-[11px]">ไม่มีพิกัด GPS</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Category Breakdown */}
        {activeTab === "categories" && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                📊 สรุปสัดส่วนค่าใช้จ่ายตามหมวดหมู่
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                คำนวณร้อยละของค่าใช้จ่ายทั้งหมด เพื่อช่วยวางแผนการบริหารจัดการเงินส่วนบุคคล
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              {calculations.sortedCategories.map((cat) => (
                <div key={cat.name} className="p-4 rounded-2xl border border-gray-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-gray-800">
                      {cat.name}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-600 mr-2">
                        ฿{cat.amount.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        ({cat.percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full"
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- ADD TRANSACTION MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="text-base font-bold">บันทึกข้อมูลรายรับ - รายจ่าย</h3>
                  <p className="text-xs text-indigo-300">จัดเก็บลง IndexedDB + พิกัด Location</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg text-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTone(450, "sine", 0.05, 0.05);
                    setFormType("expense");
                    setFormCategory("อาหาร & เครื่องดื่ม");
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    formType === "expense"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "text-gray-600 hover:text-rose-600"
                  }`}
                >
                  <span>💸</span>
                  <span>รายจ่าย (Expense)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playTone(550, "sine", 0.05, 0.05);
                    setFormType("income");
                    setFormCategory("เงินเดือน / ผู้ปกครอง");
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    formType === "income"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "text-gray-600 hover:text-emerald-600"
                  }`}
                >
                  <span>💰</span>
                  <span>รายรับ (Income)</span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  จำนวนเงิน (บาท) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 text-xl font-extrabold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="absolute left-3 top-3.5 text-gray-400 font-bold">฿</span>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  ชื่อรายการ / บันทึก *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น ข้าวกะเพราหมูกรอบ, กาแฟ, ค่าเดินทาง"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {CATEGORIES[formType].map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    เวลา
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* LOCATION SECTION (Highlighted) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-indigo-600 font-bold text-xs uppercase tracking-wider">
                      📍 บันทึกพิกัดตำแหน่ง (Location)
                    </span>
                  </div>

                  {/* GPS Button */}
                  <button
                    type="button"
                    onClick={handleFetchGPS}
                    disabled={isLocating}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                  >
                    <span>{isLocating ? "⏳" : "📡"}</span>
                    <span>{isLocating ? "กำลังดึง GPS..." : "ดึงพิกัดปัจจุบัน"}</span>
                  </button>
                </div>

                {locationStatus && (
                  <div className="text-[11px] text-indigo-800 bg-white/80 p-2 rounded-lg border border-indigo-100">
                    {locationStatus}
                  </div>
                )}

                {/* Preset Chips */}
                <div>
                  <div className="text-[10px] text-gray-500 font-medium mb-1.5">
                    หรือเลือกพิกัดแนะนำแบบด่วน:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LOCATIONS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => handleSelectPreset(preset)}
                        className="px-2 py-1 rounded-md bg-white border border-indigo-200 hover:border-indigo-500 text-indigo-900 text-[10px] font-medium transition"
                      >
                        {preset.icon} {preset.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Name Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    ชื่อสถานที่ / ป้ายกำกับ
                  </label>
                  <input
                    type="text"
                    value={formLocationName}
                    onChange={(e) => setFormLocationName(e.target.value)}
                    placeholder="เช่น ม.ธุรกิจบัณฑิตย์, สยาม, เซเว่น หรือพิมพ์เอง"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* GPS Coordinates Preview */}
                {formLatitude && formLongitude && (
                  <div className="flex items-center justify-between text-[11px] text-gray-600 bg-white/80 p-2 rounded-lg border border-indigo-100">
                    <span>
                      🌐 ละติจูด: {formLatitude}, ลองจิจูด: {formLongitude}
                    </span>
                    <a
                      href={getGoogleMapsUrl(formLatitude, formLongitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      เปิดดูบนแผนที่ ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition hover:scale-105 active:scale-95"
                >
                  บันทึกลง IndexedDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
