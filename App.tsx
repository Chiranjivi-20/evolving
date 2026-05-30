import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Car,
  ChevronRight,
  Database,
  Eye,
  FileText,
  Filter,
  Globe,
  Handshake,
  Heart,
  HelpCircle,
  Hash,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
  Upload,
  Bell,
  MessageSquare,
  Send,
  Edit,
  Pencil,
  Phone
} from "lucide-react";
import { initialDB } from "./data/mockDb";
import { vehicleCatalogs, fallbackCatalogs } from "./data/vehicleCatalogData";
import { DBState } from "./data/mockDb";
import { CompanyCatalog, VehicleCatalogEntry } from "./types";

export default function App() {
  // DB state, load from LocalStorage or seed new
  const [db, setDb] = useState<DBState>(() => {
    const keys = ["vms_db_v12", "vms_db_v11", "vms_db_v10", "vms_db_v9", "vms_db_v8", "vms_db_v7"];
    let saved = null;
    let foundVersionKey = "";
    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        saved = data;
        foundVersionKey = key;
        break;
      }
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (Array.isArray(parsed.vehicles)) {
            parsed.vehicles = parsed.vehicles.map((v: any) => ({
              ...v,
              VEHICLE_TYPE: v.VEHICLE_TYPE || v.FUEL_TYPE || v.Vehicle_type || "Petrol"
            }));
          }
          if (Array.isArray(parsed.customers)) {
            parsed.customers = parsed.customers.map((c: any) => ({
              ...c,
              C_NAME: c.C_NAME || c.C_Name,
              CITY: c.CITY || c.City,
              STATE: c.STATE || c.State,
              PIN: c.PIN
            }));
          }
          if (Array.isArray(parsed.customer_phone)) {
            parsed.customer_phone = parsed.customer_phone.map((cp: any) => ({
              ...cp,
              PH_NO: cp.PH_NO || cp["Ph No"] || cp.Ph_No || "",
              "Ph No": cp["Ph No"] || cp.PH_NO || cp.Ph_No || "",
              Ph_No: cp.Ph_No || cp.PH_NO || cp["Ph No"] || ""
            }));
          }

          const isUpgradedKey = foundVersionKey !== "vms_db_v12";

          // 1. Merge modern owned_by mapping (V_ID >= 200) if migrating from old
          if (Array.isArray(parsed.owned_by) && isUpgradedKey && (foundVersionKey === "vms_db_v7" || parsed.owned_by.length <= 2)) {
            const extraOwned = initialDB.owned_by.filter((ob) => ob.V_ID >= 200);
            extraOwned.forEach((ob) => {
              if (!parsed.owned_by.some((ex: any) => ex.V_ID === ob.V_ID)) {
                parsed.owned_by.push(ob);
              }
            });
          }

          // 2. Merge modern socials media channels (M_ID >= 100) if migrating from old
          if (Array.isArray(parsed.socials) && isUpgradedKey && (foundVersionKey === "vms_db_v7" || foundVersionKey === "vms_db_v8" || parsed.socials.length <= 2)) {
            const extraSocials = initialDB.socials.filter((s) => s.M_ID >= 100);
            extraSocials.forEach((sc) => {
              if (!parsed.socials.some((ex: any) => ex.M_ID === sc.M_ID)) {
                parsed.socials.push(sc);
              }
            });
          }

          // 3. Merge modern vehicle colors mapping (V_ID >= 200) if migrating from old
          if (Array.isArray(parsed.vehicle_color) && isUpgradedKey && (foundVersionKey === "vms_db_v7" || foundVersionKey === "vms_db_v8" || foundVersionKey === "vms_db_v9" || parsed.vehicle_color.length <= 3)) {
            const extraColors = initialDB.vehicle_color.filter((vc) => vc.V_ID >= 200);
            extraColors.forEach((vc) => {
              if (!parsed.vehicle_color.some((ex: any) => ex.V_ID === vc.V_ID)) {
                parsed.vehicle_color.push(vc);
              }
            });
          }

          // 4. Merge modern sales ID records (V_ID / S_ID mapping) if migrating from older versions
          if (isUpgradedKey || !Array.isArray(parsed.sales_id_records) || parsed.sales_id_records.length === 0) {
            parsed.sales_id_records = [...initialDB.sales_id_records];
          }

          // 5. Merge Salesperson Contact numbers
          if (isUpgradedKey || !Array.isArray(parsed.sales_phone) || parsed.sales_phone.length <= 1) {
            parsed.sales_phone = [...initialDB.sales_phone];
          }

          if (Array.isArray(parsed.sales_phone)) {
            parsed.sales_phone = parsed.sales_phone.map((sp: any) => ({
              ...sp,
              SP_PHONE: sp.SP_PHONE || sp["SP Phone"] || sp.Sp_Phone || "",
              "SP Phone": sp["SP Phone"] || sp.SP_PHONE || sp.Sp_Phone || "",
              Sp_Phone: sp.Sp_Phone || sp.SP_PHONE || sp["SP Phone"] || ""
            }));
          }

          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse local VMS DB, resetting to defaults", e);
      }
    }
    const initialWithVehicleType = {
      ...initialDB,
      vehicles: initialDB.vehicles.map((v) => ({
        ...v,
        VEHICLE_TYPE: v.FUEL_TYPE || v.Vehicle_type || "Petrol"
      })),
      customers: initialDB.customers.map((c) => ({
        ...c,
        C_NAME: c.C_NAME || c.C_Name,
        CITY: c.CITY || c.City,
        STATE: c.STATE || c.State,
        PIN: c.PIN
      })),
      customer_phone: initialDB.customer_phone.map((cp) => ({
        ...cp,
        PH_NO: cp.PH_NO || cp["Ph No"] || cp.Ph_No || ""
      })),
      sales_phone: initialDB.sales_phone.map((sp) => ({
        ...sp,
        SP_PHONE: sp.SP_PHONE || sp["SP Phone"] || ""
      }))
    };
    return initialWithVehicleType;
  });

  useEffect(() => {
    localStorage.setItem("vms_db_v12", JSON.stringify(db));
  }, [db]);

  // Auth States
  const [currentUser, setCurrentUser] = useState<{
    role: "admin" | "salesperson" | "service" | "customer";
    id?: number;
    name: string;
    email?: string;
    label: string;
  } | null>(() => {
    const savedUser = localStorage.getItem("vms_user_v1");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("vms_user_v1", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("vms_user_v1");
    }
  }, [currentUser]);

  // UI States
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginRoleType, setLoginRoleType] = useState<"customer" | "staff">("staff");
  const [selectedStaffRole, setSelectedStaffRole] = useState<"admin" | "salesperson" | "service" | "customer">("admin");
  const [currentModule, setCurrentModule] = useState<string>("dashboard");
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Auth form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regState, setRegState] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Notifications state and handlers
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("vms_notifications_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved notifications", e);
      }
    }
    return [
      {
        id: "seed_1",
        senderRole: "system",
        senderName: "VMS Core Portal",
        recipientRole: "admin",
        title: "Database Pipeline Active",
        message: "The 19 automotive brand catalogs are successfully verified and running. Live sync with localStorage active.",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        isRead: false,
        type: "system"
      },
      {
        id: "seed_2",
        senderRole: "salesperson",
        senderName: "Rajesh Kumar (Salesperson)",
        recipientRole: "admin",
        title: "Check Inventory Request",
        message: "Check if any vehicles are in the stock or not for the new Toyota Fortuner models.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        isRead: false,
        type: "message"
      },
      {
        id: "seed_3",
        senderRole: "customer",
        senderName: "Arjun Mehta",
        recipientRole: "salesperson",
        title: "New Booking Notification",
        message: "Arjun Mehta has booked a Toyota Fortuner GR Sport",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
        type: "booking"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("vms_notifications_v2", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser?.role === "customer") {
      setManagerMsgTopic("vehicle_enquiry");
      setManagerMsgRecipient("salesperson");
    } else if (currentUser?.role === "admin") {
      setManagerMsgTopic("catalog_review");
      setManagerMsgRecipient("salesperson");
    } else if (currentUser?.role === "salesperson") {
      setManagerMsgTopic("check_stock");
      setManagerMsgRecipient("admin");
    }
  }, [currentUser?.role]);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [managerMsgRecipient, setManagerMsgRecipient] = useState<"admin" | "customer" | "salesperson">("admin");
  const [managerMsgTopic, setManagerMsgTopic] = useState("check_stock");
  const [managerMsgCustomTitle, setManagerMsgCustomTitle] = useState("");
  const [managerMsgPriority, setManagerMsgPriority] = useState("normal");
  const [managerMsgText, setManagerMsgText] = useState("");

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMsgText, setReplyMsgText] = useState("");

  // States for explicit Admin <-> Salesperson hotline
  const [adminSalespersonMsgTopic, setAdminSalespersonMsgTopic] = useState("operational_query");
  const [adminSalespersonCustomSubject, setAdminSalespersonCustomSubject] = useState("");
  const [adminSalespersonMsgText, setAdminSalespersonMsgText] = useState("");
  const [adminSalespersonPriority, setAdminSalespersonPriority] = useState("normal");

  const handleSendAdminSalespersonMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSalespersonMsgText.trim() || !currentUser) return;

    let subjectLabel = "";
    if (adminSalespersonMsgTopic === "operational_query") {
      subjectLabel = "Operational Inquiry / Dialogue";
    } else if (adminSalespersonMsgTopic === "urgent") {
      subjectLabel = "⚡ URGENT Staff Notification";
    } else {
      subjectLabel = adminSalespersonCustomSubject.trim() || "Administrative Staff Update";
    }

    const recipientRole = currentUser.role === "admin" ? "salesperson" : "admin";
    
    const newNotif = {
      id: `admin_sales_${Date.now()}`,
      senderRole: currentUser.role,
      senderName: `${currentUser.name} (${currentUser.role === "admin" ? "Admin" : "Salesperson"})`,
      recipientRole: recipientRole,
      title: subjectLabel,
      message: adminSalespersonMsgText,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: "message",
      priority: adminSalespersonPriority
    };

    setNotifications(prev => [newNotif, ...prev]);
    setAdminSalespersonMsgText("");
    setAdminSalespersonCustomSubject("");
    showToast(`ホットライン: Message successfully delivered to ${recipientRole === "admin" ? "Administrator" : "Salesperson"} cabinet!`);
  };

  const handleBookVehicle = (vehicleName: string) => {
    const customerName = currentUser?.name || "Premium Customer";
    const newNotif = {
      id: `booking_${Date.now()}`,
      senderRole: "customer",
      senderName: customerName,
      recipientRole: "salesperson",
      title: "New Booking Registered",
      message: `${customerName} has booked a ${vehicleName}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: "booking",
      priority: "normal"
    };

    setNotifications(prev => [newNotif, ...prev]);
    showToast(`Successfully booked ${vehicleName}! The salesperson has been notified.`);
  };

  const handleSendManagerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerMsgText.trim()) return;

    let targetRole: "admin" | "salesperson" | "customer" = "admin";
    let senderRole = currentUser?.role || "salesperson";
    let senderName = currentUser?.name || "System User";
    let topicLabel = "";
    let successToast = "";

    if (currentUser?.role === "customer") {
      targetRole = "salesperson";
      if (managerMsgTopic === "vehicle_enquiry") {
        topicLabel = "Inquiry on Catalog Vehicles";
      } else if (managerMsgTopic === "discount_check") {
        topicLabel = "Campaign & Discount Query";
      } else {
        topicLabel = managerMsgCustomTitle.trim() || "Custom Inquiry to Sales Desk";
      }
      successToast = "Your message has been delivered to the Salesperson console!";
    } else if (currentUser?.role === "salesperson") {
      // Salesperson can send to either admin or customer
      targetRole = managerMsgRecipient === "customer" ? "customer" : "admin";
      
      if (targetRole === "admin") {
        if (managerMsgTopic === "add_cars") {
          topicLabel = "Request to Add New Cars";
        } else if (managerMsgTopic === "check_stock") {
          topicLabel = "Stock Verification Inquiry";
        } else {
          topicLabel = managerMsgCustomTitle.trim() || "Custom Inquiry to Admin Desk";
        }
        successToast = "Message successfully dispatched to Administrator console!";
      } else {
        if (managerMsgTopic === "welcome_msg") {
          topicLabel = "👋 Sales Representative Greeting";
        } else if (managerMsgTopic === "deal_offer") {
          topicLabel = "🏷️ Special Direct Vehicle Discount Offer";
        } else {
          topicLabel = managerMsgCustomTitle.trim() || "Direct Message from Salesperson";
        }
        successToast = "Your direct offer message has been sent to Customer Arjun Mehta!";
      }
    } else if (currentUser?.role === "admin") {
      targetRole = "salesperson";
      if (managerMsgTopic === "catalog_review") {
        topicLabel = "📋 Catalog Rectification Directive";
      } else if (managerMsgTopic === "sales_targets") {
        topicLabel = "📈 Dealer Performance & Objectives";
      } else {
        topicLabel = managerMsgCustomTitle.trim() || "Administrative standard update notice";
      }
      successToast = "Administrative message delivered to the Salesperson console!";
    }

    const newNotif = {
      id: `msg_${Date.now()}`,
      senderRole: senderRole,
      senderName: `${senderName} (${senderRole === "admin" ? "Admin" : senderRole === "salesperson" ? "Salesperson" : "Customer"})`,
      recipientRole: targetRole,
      title: topicLabel,
      message: managerMsgText,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: "message",
      priority: managerMsgPriority
    };

    setNotifications(prev => [newNotif, ...prev]);
    setManagerMsgText("");
    setManagerMsgCustomTitle("");
    showToast(successToast);
  };

  const handleSendReply = (originalNotif: any) => {
    if (!replyMsgText.trim()) return;

    const replyRecipientRole = originalNotif.senderRole === "system" ? "admin" : originalNotif.senderRole;
    
    const newNotif = {
      id: `msg_reply_${Date.now()}`,
      senderRole: currentUser?.role || "user",
      senderName: `${currentUser?.name || "User"} (${currentUser?.role === 'admin' ? 'Admin' : 'Salesperson'})`,
      recipientRole: replyRecipientRole,
      title: `RE: ${originalNotif.title}`,
      message: replyMsgText,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: "message",
      priority: "normal"
    };

    setNotifications(prev => [newNotif, ...prev]);
    setReplyMsgText("");
    setReplyingToId(null);
    showToast(`Reply successfully delivered to ${originalNotif.senderName}!`);
  };

  // Catalog Section state inside "Available Vehicles"
  const [selectedCatalogBrand, setSelectedCatalogBrand] = useState<string>("Toyota");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<Record<string, number>>({});
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");

  // Editable vehicle catalogs state
  const [catalogs, setCatalogs] = useState<Record<string, CompanyCatalog>>(() => {
    const saved = localStorage.getItem("vms_vehicle_catalogs_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved vehicle catalogs", e);
      }
    }
    return {};
  });

  // Automatically initialize the active brand catalog in state lazily
  useEffect(() => {
    if (!catalogs[selectedCatalogBrand]) {
      const initial = getCatalogForSelectedBrandRaw(selectedCatalogBrand);
      setCatalogs(prev => {
        if (prev[selectedCatalogBrand]) return prev;
        const next = { ...prev, [selectedCatalogBrand]: initial };
        localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
        return next;
      });
    }
  }, [selectedCatalogBrand]);

  // Action to upload main vehicle image
  const handleUploadVehicleImage = (brand: string, vehicleId: string, base64Data: string) => {
    setCatalogs(prev => {
      const currentBrandCatalog = prev[brand] || getCatalogForSelectedBrandRaw(brand);
      const next = {
        ...prev,
        [brand]: {
          ...currentBrandCatalog,
          vehicles: currentBrandCatalog.vehicles.map((v) => {
            if (v.id === vehicleId) {
              return {
                ...v,
                imageUrl: base64Data,
                metadata: {
                  ...v.metadata,
                  fileType: "PNG (uploaded custom file)",
                  dateAccessed: new Date().toISOString().substring(0, 10),
                  sourceType: "Admin Web Upload"
                }
              };
            }
            return v;
          })
        }
      };
      localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
      return next;
    });
    showToast("Vehicle catalog image updated successfully!");
  };

  // Action to upload interior/exterior perspective views
  const handleUploadInteriorExterior = (
    brand: string,
    vehicleId: string,
    viewType: "Interior" | "Exterior",
    base64Data: string,
    descriptionText: string
  ) => {
    setCatalogs(prev => {
      const currentBrandCatalog = prev[brand] || getCatalogForSelectedBrandRaw(brand);
      const next = {
        ...prev,
        [brand]: {
          ...currentBrandCatalog,
          vehicles: currentBrandCatalog.vehicles.map((v) => {
            if (v.id === vehicleId) {
              const currentViews = v.interiorExteriorDetails || [];
              const newTitle = `${viewType} View`;
              const newView = {
                title: newTitle,
                imageUrl: base64Data,
                description: descriptionText || `High-resolution visual representation showing the premium ${viewType.toLowerCase()} styling details.`
              };
              return {
                ...v,
                interiorExteriorDetails: [...currentViews, newView]
              };
            }
            return v;
          })
        }
      };
      localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
      return next;
    });
    showToast(`${viewType} view added to catalog successfully!`);
  };

  // Action to upload company banner
  const handleUploadCompanyBanner = (brand: string, base64Data: string) => {
    setCatalogs(prev => {
      const currentBrandCatalog = prev[brand] || getCatalogForSelectedBrandRaw(brand);
      const next = {
        ...prev,
        [brand]: {
          ...currentBrandCatalog,
          bannerUrl: base64Data
        }
      };
      localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
      return next;
    });
    showToast("Company catalog banner updated successfully!");
  };

  // Action to reset catalog to defaults
  const handleResetCatalog = (brand: string) => {
    let proceed = false;
    try {
      proceed = confirm(`Are you sure you want to reset the ${brand} catalog to its original pictures and default specifications?`);
    } catch (e) {
      console.warn("confirm blocked by sandbox, defaulting to true", e);
      proceed = true;
    }
    if (proceed) {
      setCatalogs(prev => {
        const next = { ...prev };
        delete next[brand];
        localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
        return next;
      });
      showToast(`Reset ${brand} catalog to factory defaults!`);
    }
  };

  // State and methods for editing vehicle catalog entries
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatCategory, setEditCatCategory] = useState("");
  const [editCatPrice, setEditCatPrice] = useState("");
  const [editCatEngine, setEditCatEngine] = useState("");
  const [editCatTransmission, setEditCatTransmission] = useState("");
  const [editCatDimensions, setEditCatDimensions] = useState("");
  const [editCatFuelType, setEditCatFuelType] = useState("");
  const [editCatSource, setEditCatSource] = useState("");
  const [editCatDesign, setEditCatDesign] = useState("");
  const [editCatSafety, setEditCatSafety] = useState("");
  const [editCatTech, setEditCatTech] = useState("");
  const [editCatBadges, setEditCatBadges] = useState("");

  const handleStartEdit = (entry: VehicleCatalogEntry) => {
    setEditingVehicleId(entry.id);
    setEditCatName(entry.name);
    setEditCatCategory(entry.category);
    setEditCatPrice(entry.priceRange);
    setEditCatEngine(entry.specifications.engine);
    setEditCatTransmission(entry.specifications.transmission);
    setEditCatDimensions(entry.specifications.dimensions);
    setEditCatFuelType(entry.specifications.fuelType);
    setEditCatSource(entry.sourceOrigin);
    setEditCatDesign((entry.keyFeatures?.design || []).join(", "));
    setEditCatSafety((entry.keyFeatures?.safety || []).join(", "));
    setEditCatTech((entry.keyFeatures?.technology || []).join(", "));
    setEditCatBadges((entry.visibleBadges || []).join(", "));
  };

  const handleSaveEditSubmit = (brand: string, vehicleId: string) => {
    setCatalogs(prev => {
      const currentBrandCatalog = prev[brand] || getCatalogForSelectedBrandRaw(brand);
      const next = {
        ...prev,
        [brand]: {
          ...currentBrandCatalog,
          vehicles: currentBrandCatalog.vehicles.map((v) => {
            if (v.id === vehicleId) {
              return {
                ...v,
                name: editCatName,
                category: editCatCategory,
                priceRange: editCatPrice,
                sourceOrigin: editCatSource,
                specifications: {
                  ...v.specifications,
                  engine: editCatEngine,
                  transmission: editCatTransmission,
                  dimensions: editCatDimensions,
                  fuelType: editCatFuelType
                },
                keyFeatures: {
                  design: editCatDesign.split(",").map(s => s.trim()).filter(Boolean),
                  safety: editCatSafety.split(",").map(s => s.trim()).filter(Boolean),
                  technology: editCatTech.split(",").map(s => s.trim()).filter(Boolean)
                },
                visibleBadges: editCatBadges.split(",").map(s => s.trim()).filter(Boolean)
              };
            }
            return v;
          })
        }
      };
      localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
      return next;
    });
    setEditingVehicleId(null);
    showToast("Vehicle details rectified successfully in catalog!");
  };

  // Actions to handle custom catalog vehicle insertion
  const [isAddCatalogVehicleOpen, setIsAddCatalogVehicleOpen] = useState(false);
  const [newCatModel, setNewCatModel] = useState("");
  const [newCatCategory, setNewCatCategory] = useState("Premium SUV");
  const [newCatEngine, setNewCatEngine] = useState("");
  const [newCatTransmission, setNewCatTransmission] = useState("");
  const [newCatPrice, setNewCatPrice] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);

  const handleAddCatalogVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatModel) return;

    const brand = selectedCatalogBrand;
    const newEntryId = `custom_${brand.toLowerCase()}_${Date.now()}`;
    const newEntry: VehicleCatalogEntry = {
      id: newEntryId,
      name: `${brand} ${newCatModel}`,
      modelName: newCatModel,
      category: newCatCategory,
      imageUrl: newCatImage || "https://images.unsplash.com/photo-1542362567-b072da132131?q=80&w=800",
      specifications: {
        engine: newCatEngine || "2.5-liter turbocharged high performance motor",
        transmission: newCatTransmission || "8-speed automatic with driving dynamic sensors",
        dimensions: "4685 mm L x 1890 mm W x 1755 mm H",
        fuelType: "Petrol / Diesel Alternate"
      },
      keyFeatures: {
        design: ["Aerodynamic sporty facade decoration", "Elegant alloy wheel structure with status calipers", "Advanced LED Headlamps with Adaptive High Beam"],
        safety: ["Comprehensive occupant restraint bags", "Assisted adaptive emergency braking sensor suite", "Electronic stability with Rollover Mitigation"],
        technology: ["State-aware connected media touchscreen navigation console", "Immersive custom multi-speaker audio system", "Amazon Alexa voice helper directly wired into controls"]
      },
      visibleBadges: [`${brand} Signature Crest`, "Custom Edition Series", "Premium Trim Line"],
      sourceOrigin: "User Custom App Catalog Upload Utility",
      metadata: {
        resolution: "3000 x 2000 pixels",
        fileType: "PNG (uploaded layout base)",
        dateAccessed: new Date().toISOString().substring(0, 10),
        sourceType: "Direct Interactive Catalog Addition"
      },
      priceRange: newCatPrice ? `₹${newCatPrice} onwards` : "Price upon configurations request",
      interiorExteriorDetails: []
    };

    setCatalogs(prev => {
      const currentBrandCatalog = prev[brand] || getCatalogForSelectedBrandRaw(brand);
      const next = {
        ...prev,
        [brand]: {
          ...currentBrandCatalog,
          vehicles: [newEntry, ...currentBrandCatalog.vehicles]
        }
      };
      localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
      return next;
    });

    // Reset fields
    setNewCatModel("");
    setNewCatCategory("Premium SUV");
    setNewCatEngine("");
    setNewCatTransmission("");
    setNewCatPrice("");
    setNewCatImage(null);
    setIsAddCatalogVehicleOpen(false);
    showToast(`Successfully added custom model "${newCatModel}" to ${brand} catalog!`);
  };

  // Dynamic Add Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEntity, setAddEntity] = useState<string>("");
  const [addFormValues, setAddFormValues] = useState<Record<string, string>>({});

  // Dynamic Edit/Update Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<string>("");
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editFormValues, setEditFormValues] = useState<Record<string, string>>({});

  // Customer dynamic registration state
  const [isCustRegModalOpen, setIsCustRegModalOpen] = useState(false);
  const [selectedRegVehicleId, setSelectedRegVehicleId] = useState<number | null>(null);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    entityName: string;
    idField: string;
    idValue: any;
    rIdx: number;
  } | null>(null);

  // Toast Helper
  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentModule("dashboard");
    showToast("Successfully logged out");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRoleType === "customer") {
      const trimmedName = loginName.trim().toLowerCase();
      const cleanedPhone = loginPhone.replace(/[^0-9]/g, "");

      const found = db.customers.find((c) => {
        const cName = (c.C_Name || c.C_NAME || "").trim().toLowerCase();
        if (cName !== trimmedName) return false;

        // Check if there's a phone number for this customer matching the input
        const matchPhone = db.customer_phone.some((cp) => {
          if (cp.C_ID !== c.C_ID) return false;
          const cpNum = (cp.PH_NO || cp["Ph No"] || cp.Ph_No || "").replace(/[^0-9]/g, "");
          return cpNum === cleanedPhone;
        });
        return matchPhone;
      });

      if (found) {
        setCurrentUser({
          role: "customer",
          id: found.C_ID,
          name: found.C_Name || found.C_NAME || "",
          label: `👤 Customer: ${found.C_Name || found.C_NAME}`
        });
        setCurrentModule("dashboard");
        showToast(`Welcome back, ${found.C_Name || found.C_NAME}!`);
      } else {
        showToast("Invalid customer Name or Phone Number. Hint: Arjun Mehta / 8105663322", true);
      }
    } else {
      if (selectedStaffRole === "admin" && staffPassword === "admin123") {
        setCurrentUser({
          role: "admin",
          name: "Admin",
          label: "👑 Administrator"
        });
        setCurrentModule("dashboard");
        showToast("Logged in as System Admin");
      } else if (selectedStaffRole === "salesperson" && (staffPassword === "manager123" || staffPassword === "salesperson123")) {
        setCurrentUser({
          role: "salesperson",
          name: "Salesperson",
          label: "📊 Salesperson"
        });
        setCurrentModule("dashboard");
        showToast("Logged in as Salesperson");
      } else if (selectedStaffRole === "service" && staffPassword === "service123") {
        setCurrentUser({
          role: "service",
          name: "Service Crew",
          label: "🔧 Service Expert"
        });
        setCurrentModule("dashboard");
        showToast("Logged in as Service Crew");
      } else if (selectedStaffRole === "customer") {
        setCurrentUser({
          role: "customer",
          id: 201,
          name: "Customer",
          label: "👤 Customer"
        });
        setCurrentModule("dashboard");
        showToast("Logged in as Customer");
      } else {
        showToast("Incorrect staff password. Hints: admin••••, salesperson••••, service••••", true);
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regCity || !regState || !regPin) {
      showToast("All fields are strictly required", true);
      return;
    }
    if (regPhone.length !== 10 || isNaN(Number(regPhone))) {
      showToast("Phone number must be exactly 10 digits", true);
      return;
    }
    if (regPin.length !== 6 || isNaN(Number(regPin))) {
      showToast("PIN code must be exactly 6 digits", true);
      return;
    }

    const cleanedRegPhone = regPhone.replace(/[^0-9]/g, "");
    const phoneExists = db.customer_phone.some(
      (cp) => (cp.PH_NO || cp["Ph No"] || cp.Ph_No || "").replace(/[^0-9]/g, "") === cleanedRegPhone
    );
    if (phoneExists) {
      showToast("A user with this phone number already exists", true);
      return;
    }

    const nextCId = Math.max(...db.customers.map((c) => c.C_ID), 200) + 1;
    const newCustomer = {
      C_ID: nextCId,
      C_Name: regName,
      C_NAME: regName,
      City: regCity,
      CITY: regCity,
      State: regState,
      STATE: regState,
      PIN: regPin
    };

    setDb((prev) => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
      customer_phone: [...prev.customer_phone, { C_ID: nextCId, "Ph No": regPhone, PH_NO: regPhone, Ph_No: regPhone }]
    }));

    showToast("Registration successful! You may now log in.");
    setAuthMode("login");
    setLoginName(regName);
    setLoginPhone(regPhone);
  };

  // Switch brand callback
  const selectBrand = (brandName: string) => {
    setIsExtracting(true);
    setSelectedCatalogBrand(brandName);
    setTimeout(() => {
      setIsExtracting(false);
    }, 700);
  };

  // Dynamic catalog fetcher that merges pre-seeded data with customized real specs
  const getCatalogForSelectedBrandRaw = (brand: string): CompanyCatalog => {
    const existing = vehicleCatalogs[brand] || fallbackCatalogs[brand];
    if (existing) return existing;

    // Researched specifications dynamically generated for smaller models or general brand portfolios
    const standardSpecs: Record<string, any> = {
      "Maruti Suzuki": {
        desc: "Maruti Suzuki India Limited is an Indian subsidiary of Suzuki Motor Corporation. It owns the highest automotive market share in the Indian subcontinent, famous for extremely high fuel efficiency and incredible spare part networks.",
        banner: "https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=1200",
        country: "India / Japan",
        cars: [
          {
            id: "mar_swift",
            model: "Swift",
            type: "Hatchback",
            image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800",
            engine: "1.2L Z-Series 3-cylinder Petrol, 82 HP / 112 Nm",
            transmission: "5-speed manual or AMT automatic",
            price: "₹6.49 Lakh - ₹9.64 Lakh",
            badges: ["'Z12E' Engine Tech", "Suzuki Chrome Shield Logo", "Swift Rear Plate"]
          },
          {
            id: "mar_grand_vitara",
            model: "Grand Vitara",
            type: "Mid SUV Strong Hybrid",
            image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=800",
            engine: "1.5L Intelligent Utility Strong Hybrid Petrol, combined 115 HP",
            transmission: "e-CVT automatic with ALLGRIP SELECT AWD option",
            price: "₹10.99 Lakh - ₹20.09 Lakh",
            badges: ["'Hybrid' dual-tone logo", "AllGrip embossed rear", "Grand Vitara text"]
          }
        ]
      },
      "Bajaj": {
        desc: "Bajaj Auto Limited is an Indian multinational automotive manufacturing company based in Pune. It is the world's third-largest manufacturer of motorcycles and the largest manufacturer of three-wheelers.",
        banner: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200",
        country: "India",
        cars: [
          {
            id: "baj_dominar_400",
            model: "Dominar 400",
            type: "Hyper Cruiser",
            image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800",
            engine: "373.3cc liquid-cooled single-cylinder, DOHC, Tri-spark DTS-i, 40 HP / 35 Nm",
            transmission: "6-speed manual with slipper clutch",
            price: "₹2.35 Lakh onwards",
            badges: ["'D400' green fuel tank badging", "Triple-spark decal", "Bajaj Star Emblem"]
          }
        ]
      },
      "Kawasaki": {
        desc: "Kawasaki Motors, Ltd. is a major Japanese motorcycle manufacturer known worldwide for premium high speed sport, cruise touring, and professional trail motorcycles.",
        banner: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=1200",
        country: "Japan",
        cars: [
          {
            id: "kaw_ninja_zx10r",
            model: "Ninja ZX-10R",
            type: "Superbike",
            image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800",
            engine: "998cc 16-valve inline-four water-cooled, 203 HP / 114.9 Nm",
            transmission: "6-speed cassette return mechanical shift with quickshifter",
            price: "₹16.79 Lakh onwards",
            badges: ["'Kawasaki ZX' wing cowling green decal", "Ninja signature scripts", "KTRC label"]
          }
        ]
      },
      "TVS": {
        desc: "TVS Motor Company is a prominent Indian multinational motorcycle manufacturer headquartered in Chennai. It stands as the third-largest motorcycle company in active volume in India.",
        banner: "https://images.unsplash.com/photo-1622185135505-2d795003994a?q=80&w=1200",
        country: "India",
        cars: [
          {
            id: "tvs_apache_rr310",
            model: "Apache RR 310",
            type: "Sports Motorcycle",
            image: "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?q=80&w=800",
            engine: "312.2cc reverse-inclined DOHC liquid-cooled single cylinder, 34 HP",
            transmission: "6-speed gearbox with race slipper clutch",
            price: "₹2.72 Lakh - ₹3.10 Lakh",
            badges: ["TVS Charging Horse insignia", "'Akula' stealth frame accents", "RR310 carbon finish decal"]
          }
        ]
      },
      "Eicher": {
        desc: "VE Commercial Vehicles Limited is a joint venture between Volvo Group and Eicher Motors Limited. Renowned across South-Asia for robust sub-5 ton light/medium cargo haulers and tippers.",
        banner: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200",
        country: "India / Sweden (JV)",
        cars: [
          {
            id: "eich_pro_2049",
            model: "Pro 2049 (Sub 5 Ton)",
            type: "Light Duty Cargo Truck",
            image: "https://images.unsplash.com/photo-1516576880881-1740924be240?q=80&w=800",
            engine: "E366 3-cylinder diesel, 100 HP / 285 Nm",
            transmission: "5-speed manual with hydraulic clutch power guidance",
            price: "₹12.10 Lakh onwards",
            badges: ["'EICHER' chrome text over grill", "Pro 2049 badge", "E366 engine plate"]
          }
        ]
      },
      "Ashok Leyland": {
        desc: "Ashok Leyland is an Indian multinational automotive manufacturer headquartered in Chennai. Owned by the Hinduja Group, it stands as India's pioneer in heavy commercial trucks and logistics.",
        banner: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200",
        country: "India",
        cars: [
          {
            id: "ash_2820",
            model: "Ashok Leyland 2820",
            type: "Heavy Commercial Truck",
            image: "https://images.unsplash.com/photo-1592838064575-70ed626d3a44?q=80&w=800",
            engine: "H Series 6-Cylinder Diesel with iGen6 Tech, 200 HP / 700 Nm",
            transmission: "6-speed synchromesh manual",
            price: "₹39.55 Lakh - ₹43.65 Lakh",
            badges: ["'ASHOK LEYLAND' bold center decal", "iGen6 logo mark on door side", "2820 axle plate"]
          }
        ]
      },
      "Renault": {
        desc: "Renault S.A. is a French multinational automobile manufacturer. In India, Renault specializes in modular family utility vehicles (Triber), premium compact crossovers (Kiger, Kwid), and heavy structural adventure builds.",
        banner: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200",
        country: "France",
        cars: [
          {
            id: "ren_triber",
            model: "Triber",
            type: "Modular MPV",
            image: "https://images.unsplash.com/photo-1621259182978-f09e5e2cd091?q=80&w=800",
            engine: "1.0L 3-cylinder energy petrol engine, 72 HP / 96 Nm",
            transmission: "5-speed manual or Easy-R AMT automatic",
            price: "₹5.80 Lakh - ₹8.97 Lakh",
            badges: ["Renault Diamond insignia", "Triber chrome on back door spacer"]
          }
        ]
      },
      "Kia": {
        desc: "Kia Corporation is a South Korean multinational automobile manufacturer. Famous globally for cutting-edge digital instrument panels, connected services, and high-performance electric crossovers.",
        banner: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200",
        country: "South Korea",
        cars: [
          {
            id: "kia_seltos",
            model: "Seltos",
            type: "Premium Compact SUV",
            image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800",
            engine: "1.5L Turbo GDi Petrol, 160 HP / 253 Nm",
            transmission: "6-speed manual, iVT, or 7-speed dual-clutch transmission (DCT)",
            price: "₹10.90 Lakh - ₹20.35 Lakh",
            badges: ["New Kia premium asymmetric logo", "Seltos lettering", "GT-Line sports emblem"]
          }
        ]
      }
    };

    const setup = standardSpecs[brand] || {
      desc: `${brand} is a globally renowned premium automobile supplier with incredible performance, design signatures, and class-leading engineering parameters.`,
      banner: "https://images.unsplash.com/photo-1542362567-b072da132131?q=80&w=1200",
      country: "Global Portfolio",
      cars: [
        {
          id: `gen_${brand.toLowerCase()}_model`,
          model: "Standard Series",
          type: "Luxury Vehicle Selection",
          image: "https://images.unsplash.com/photo-1542362567-b072da132131?q=80&w=800",
          engine: "2.0-liter turbocharged high performance motor",
          transmission: "8-speed automatic with driving dynamic sensors",
          price: "Price upon custom configuration request",
          badges: [`${brand} Badge`, "Exclusive Trim Line"]
        }
      ]
    };

    return {
      companyName: brand,
      description: setup.desc,
      originCountry: setup.country,
      bannerUrl: setup.banner,
      vehicles: setup.cars.map((car: any) => ({
        id: car.id,
        name: `${brand} ${car.model}`,
        modelName: car.model,
        category: car.type,
        imageUrl: car.image,
        specifications: {
          engine: car.engine,
          transmission: car.transmission,
          dimensions: "Tuned strictly to global manufacturer standards",
          fuelType: "Varies according to trim preference"
        },
        keyFeatures: {
          design: ["Aerodynamic contouring", "Distinct front grille structure matching brand heritage", "Dynamic alloy configurations"],
          safety: ["Complete impact absorption cage", "Active safety suite with stabilization assists", "Emergency brake pre-charge system"],
          technology: ["Multifunction telemetry dials", "Seamless mobile ecosystem links", "Dynamic surround audio layout"]
        },
        visibleBadges: car.badges,
        sourceOrigin: `Official ${brand} Corporate Archive and Field Catalogue Database`,
        metadata: {
          resolution: "1920 x 1080 pixels",
          fileType: "JPEG (highly optimized)",
          dateAccessed: new Date().toISOString().substring(0, 10),
          sourceType: "Catalog Resource Database scan"
        },
        priceRange: car.price,
        interiorExteriorDetails: []
      }))
    };
  };

  // State-aware dynamic catalog fetcher
  const getCatalogForSelectedBrand = (): CompanyCatalog => {
    return catalogs[selectedCatalogBrand] || getCatalogForSelectedBrandRaw(selectedCatalogBrand);
  };

  // List of all 19 automotive companies shown in PDFs/Screenshots
  const AUTO_COMPANIES = [
    { name: "Toyota", logo: "🇯🇵" },
    { name: "Maruti Suzuki", logo: "🇯🇵" },
    { name: "Mahindra", logo: "🇮🇳" },
    { name: "Rolls-Royce", logo: "🇬🇧" },
    { name: "Skoda", logo: "🇨🇿" },
    { name: "Volkswagen", logo: "🇩🇪" },
    { name: "Honda", logo: "🇯🇵" },
    { name: "Lamborghini", logo: "🇮🇹" },
    { name: "Royal Enfield", logo: "🇮🇳" },
    { name: "Bajaj", logo: "🇮🇳" },
    { name: "TVS", logo: "🇮🇳" },
    { name: "Hyundai", logo: "🇰🇷" },
    { name: "Tata Motors", logo: "🇮🇳" },
    { name: "Kia", logo: "🇰🇷" },
    { name: "BMW", logo: "🇩🇪" },
    { name: "Kawasaki", logo: "🇯🇵" },
    { name: "Renault", logo: "🇫🇷" },
    { name: "Eicher", logo: "🇮🇳" },
    { name: "Ashok Leyland", logo: "🇮🇳" }
  ];

  // Helper selectors
  const getHumanFriendlyModuleName = (moduleName: string) => {
    if (moduleName === "vehicles") return "Vehicles Registered";
    if (moduleName === "customers") return "Customers List";
    if (moduleName === "customer_phone") return "Customer Phone";
    if (moduleName === "service_phone") return "Authorized Centres";
    if (moduleName === "serviced_at") return "Maintenance Logs";
    if (moduleName === "service_centre") return "Vehicles Serviced";
    if (moduleName === "sales_id_records") return "Sales ID Records";
    if (moduleName === "sales_phone") return "Salesperson Contact";
    if (moduleName === "owned_by") return "Ownership Matrix";
    return moduleName.replace(/_/g, " ");
  };

  const getManuName = (mid: number) => {
    const m = db.manufacturers.find((mn) => mn.M_ID === mid);
    return m ? m.M_Name : "Unknown";
  };

  const getMyVehicles = () => {
    if (!currentUser || currentUser.role !== "customer") return [];
    const ownedIds = db.owned_by.filter((o) => o.C_ID === currentUser.id).map((o) => o.V_ID);
    return db.vehicles.filter((v) => ownedIds.includes(v.V_ID));
  };

  // Add DB table CRUD functions
  const handleDeleteRow = (entityName: string, idField: string, idValue: any, rIdx: number) => {
    setDeleteConfirmation({ entityName, idField, idValue, rIdx });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return;
    const { entityName, idField, rIdx } = deleteConfirmation;

    setDb((prev: any) => {
      const targetArray = prev[entityName];
      if (!Array.isArray(targetArray)) return prev;
      const updatedArray = targetArray.filter((_, idx) => idx !== rIdx);
      return {
        ...prev,
        [entityName]: updatedArray
      };
    });

    setDeleteConfirmation(null);
    showToast(`Deleted ${entityName.replace(/_/g, " ")} entry successfully.`);
  };

  const handleOpenAddModal = (entityName: string) => {
    setAddEntity(entityName);
    setIsAddModalOpen(true);

    // Prepare helper default inputs based on keys of the table array schema
    let fields: Record<string, string> = {};
    if (entityName === "vehicles") {
      fields = { V_ID: "", VIN: "", REG_NO: "", PRICE: "", VEHICLE_TYPE: "", YEAR_OF_MANUFACTURE: "2024", MODEL: "", M_ID: "111" };
    } else if (entityName === "customers") {
      fields = { C_ID: "", C_NAME: "", CITY: "", STATE: "", PIN: "" };
    } else if (entityName === "sales") {
      fields = { V_ID: "", SP_Name: "", S_Date: new Date().toISOString().substring(0, 10), S_Price: "", Units_Sold: "1", Units_Remain: "4", M_Name: "" };
    } else if (entityName === "service_centre") {
      fields = { SC_ID: "", REG_NO: "", MECH_ID: "", MECH_NAME: "" };
    } else if (entityName === "serviced_at") {
      fields = { V_ID: "", SC_ID: "", COST: "", DATE_OF_SERV: new Date().toISOString().substring(0, 10), DESCRIPTION: "", Next_Date: "" };
    } else if (entityName === "service_phone") {
      fields = { SC_ID: "", SC_PHONE: "", SC_LOCATE: "" };
    } else if (entityName === "vehicle_color") {
      fields = { V_ID: "", COLOR: "" };
    } else if (entityName === "socials") {
      fields = { M_ID: "", "SOCIAL_MEDIA": "" };
    } else if (entityName === "customer_phone") {
      fields = { C_ID: "", PH_NO: "" };
    } else if (entityName === "owned_by") {
      fields = { V_ID: "", C_ID: "" };
    } else if (entityName === "sales_id_records") {
      fields = { V_ID: "", S_ID: "" };
    } else if (entityName === "sales_phone") {
      fields = { S_ID: "", SP_PHONE: "" };
    }
    setAddFormValues(fields);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Field check logic
    for (const key of Object.keys(addFormValues)) {
      if (!addFormValues[key].trim()) {
        showToast(`Required field missing: ${key}`, true);
        return;
      }
    }

    setDb((prev: any) => {
      const targetArray = prev[addEntity];
      if (!Array.isArray(targetArray)) return prev;

      const newRecord: any = {};
      // Calculate id key
      let idKey = "";
      let nextIdVal = Date.now();
      if (addEntity === "vehicles") {
        idKey = "V_ID";
        nextIdVal = Math.max(...prev.vehicles.map((v: any) => v.V_ID), 100) + 1;
      } else if (addEntity === "customers") {
        idKey = "C_ID";
        nextIdVal = Math.max(...prev.customers.map((c: any) => c.C_ID), 200) + 1;
      } else if (addEntity === "sales") {
        idKey = "S_ID";
        nextIdVal = Math.max(...prev.sales.map((s: any) => s.S_ID), 300) + 1;
      }

      if (idKey) {
        // If user typed V_ID or C_ID in the fields, prioritize that!
        if (addFormValues[idKey] && !isNaN(Number(addFormValues[idKey]))) {
          newRecord[idKey] = Number(addFormValues[idKey]);
        } else {
          newRecord[idKey] = nextIdVal;
        }
      }

      // Populate other fields conforming to numbers
      for (const key of Object.keys(addFormValues)) {
        if (key === idKey) continue; // already handled
        const val = addFormValues[key];
        const numVal = Number(val);
        if (
          [
            "Price",
            "PRICE",
            "Cost",
            "COST",
            "Units_Sold",
            "Units_Remain",
            "M_ID",
            "V_ID",
            "SC_ID",
            "C_ID",
            "S_ID",
            "Mech_ID",
            "MECH_ID",
            "Year_of_Manufacture",
            "YEAR_OF_MANUFACTURE",
            "S_Price"
          ].includes(key) &&
          !isNaN(numVal)
        ) {
          newRecord[key] = numVal;
        } else {
          newRecord[key] = val;
        }

        // Add both variants to support dual structures
        if (key === "REG_NO") newRecord["Reg_NO"] = val;
        if (key === "PRICE") newRecord["Price"] = numVal;
        if (key === "VEHICLE_TYPE") {
          newRecord["Vehicle_type"] = val;
          newRecord["Fuel_Type"] = val;
          newRecord["FUEL_TYPE"] = val;
          newRecord["VEHICLE_TYPE"] = val;
        }
        if (key === "YEAR_OF_MANUFACTURE") newRecord["Year_of_Manufacture"] = numVal;
        if (key === "MODEL") newRecord["Model"] = val;

        if (key === "MECH_ID") newRecord["Mech_ID"] = numVal;
        if (key === "MECH_NAME") newRecord["Mech_Name"] = val;
        if (key === "COST") newRecord["Cost"] = numVal;
        if (key === "DATE_OF_SERV") newRecord["Date_of_Serv"] = val;
        if (key === "DESCRIPTION") newRecord["Description"] = val;
        if (key === "SC_PHONE") newRecord["SC Phone"] = val;
        if (key === "SC_LOCATE") newRecord["SC Locate"] = val;

        // Customer syncing
        if (key === "C_NAME") newRecord["C_Name"] = val;
        if (key === "C_Name") newRecord["C_NAME"] = val;
        if (key === "CITY") newRecord["City"] = val;
        if (key === "City") newRecord["CITY"] = val;
        if (key === "STATE") newRecord["State"] = val;
        if (key === "State") newRecord["STATE"] = val;

        // Customer Phone syncing
        if (key === "PH_NO" || key === "Ph_No" || key === "Ph No") {
          newRecord["PH_NO"] = val;
          newRecord["Ph_No"] = val;
          newRecord["Ph No"] = val;
        }

        // Salesperson Phone syncing
        if (key === "SP_PHONE" || key === "SP Phone" || key === "Sp_Phone" || key === "Sp Phone") {
          newRecord["SP_PHONE"] = val;
          newRecord["SP Phone"] = val;
          newRecord["Sp_Phone"] = val;
        }

        // Social Media syncing
        if (key === "Social Media" || key === "SOCIAL_MEDIA") {
          newRecord["Social Media"] = val;
          newRecord["SOCIAL_MEDIA"] = val;
        }

        // Vehicle Color syncing
        if (key === "Color" || key === "COLOR") {
          newRecord["Color"] = val;
          newRecord["COLOR"] = val;
        }
      }

      return {
        ...prev,
        [addEntity]: [...targetArray, newRecord]
      };
    });

    setIsAddModalOpen(false);
    showToast(`Successfully added a new entry to ${getHumanFriendlyModuleName(addEntity)}`);
  };

  const handleOpenEditModal = (entityName: string, row: any, rIdx: number) => {
    setEditEntity(entityName);
    setEditingRowIndex(rIdx);
    setIsEditModalOpen(true);

    let fields: Record<string, string> = {};
    Object.keys(row).forEach((key) => {
      // Exclude redundant casing keys to keep forms tidy
      const lowercaseKeysToExclude = [
        "Reg_NO", "Mech_ID", "Mech_Name", "Cost", "Date_of_Serv", "Description", 
        "SC Phone", "SC Locate", "Price", "Vehicle_type", "Fuel_Type", "FUEL_TYPE",
        "Year_of_Manufacture", "Model", "C_Name", "City", "State", "Ph No", "Ph_No",
        "Social Media", "Color", "SP Phone", "Sp_Phone"
      ];
      if (
        lowercaseKeysToExclude.includes(key) && 
        (
          row.hasOwnProperty(key.toUpperCase()) || 
          row.hasOwnProperty("VEHICLE_TYPE") ||
          row.hasOwnProperty("C_NAME") ||
          row.hasOwnProperty("CITY") ||
          row.hasOwnProperty("STATE") ||
          row.hasOwnProperty("PH_NO") ||
          row.hasOwnProperty("SOCIAL_MEDIA") ||
          row.hasOwnProperty("COLOR") ||
          row.hasOwnProperty("SP_PHONE")
        )
      ) {
        return;
      }
      fields[key] = String(row[key]);
    });
    setEditFormValues(fields);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setDb((prev: any) => {
      const targetArray = prev[editEntity];
      if (!Array.isArray(targetArray)) return prev;

      const updatedArray = targetArray.map((row: any, rIdx: number) => {
        if (rIdx === editingRowIndex) {
          const updatedRow: any = { ...row };
          for (const key of Object.keys(editFormValues)) {
            const val = editFormValues[key];
            const numVal = Number(val);
            if (
              [
                "Price",
                "PRICE",
                "Cost",
                "COST",
                "Units_Sold",
                "Units_Remain",
                "M_ID",
                "V_ID",
                "SC_ID",
                "C_ID",
                "S_ID",
                "Mech_ID",
                "MECH_ID",
                "Year_of_Manufacture",
                "YEAR_OF_MANUFACTURE",
                "S_Price"
              ].includes(key) &&
              !isNaN(numVal)
            ) {
              updatedRow[key] = numVal;
            } else {
              updatedRow[key] = val;
            }

            // Keep backup keys synchronized
            if (key === "REG_NO") updatedRow["Reg_NO"] = val;
            if (key === "PRICE") updatedRow["Price"] = numVal;
            if (key === "VEHICLE_TYPE") {
              updatedRow["Vehicle_type"] = val;
              updatedRow["Fuel_Type"] = val;
              updatedRow["FUEL_TYPE"] = val;
              updatedRow["VEHICLE_TYPE"] = val;
            }
            if (key === "YEAR_OF_MANUFACTURE") updatedRow["Year_of_Manufacture"] = numVal;
            if (key === "MODEL") updatedRow["Model"] = val;

            if (key === "MECH_ID") updatedRow["Mech_ID"] = numVal;
            if (key === "MECH_NAME") updatedRow["Mech_Name"] = val;
            if (key === "COST") updatedRow["Cost"] = numVal;
            if (key === "DATE_OF_SERV") updatedRow["Date_of_Serv"] = val;
            if (key === "DESCRIPTION") updatedRow["Description"] = val;
            if (key === "SC_PHONE") updatedRow["SC Phone"] = val;
            if (key === "SC_LOCATE") updatedRow["SC Locate"] = val;

            // Customer syncing
            if (key === "C_NAME") {
              updatedRow["C_Name"] = val;
              updatedRow["C_NAME"] = val;
            }
            if (key === "C_Name") {
              updatedRow["C_Name"] = val;
              updatedRow["C_NAME"] = val;
            }
            if (key === "CITY") {
              updatedRow["City"] = val;
              updatedRow["CITY"] = val;
            }
            if (key === "City") {
              updatedRow["City"] = val;
              updatedRow["CITY"] = val;
            }
            if (key === "STATE") {
              updatedRow["State"] = val;
              updatedRow["STATE"] = val;
            }
            if (key === "State") {
              updatedRow["State"] = val;
              updatedRow["STATE"] = val;
            }
            if (key === "PH_NO") {
              updatedRow["PH_NO"] = val;
              updatedRow["Ph No"] = val;
              updatedRow["Ph_No"] = val;
            }
            if (key === "Ph No") {
              updatedRow["PH_NO"] = val;
              updatedRow["Ph No"] = val;
              updatedRow["Ph_No"] = val;
            }
            if (key === "Ph_No") {
              updatedRow["PH_NO"] = val;
              updatedRow["Ph No"] = val;
              updatedRow["Ph_No"] = val;
            }
            if (key === "Social Media") {
              updatedRow["Social Media"] = val;
              updatedRow["SOCIAL_MEDIA"] = val;
            }
            if (key === "SOCIAL_MEDIA") {
              updatedRow["Social Media"] = val;
              updatedRow["SOCIAL_MEDIA"] = val;
            }
            if (key === "Color") {
              updatedRow["Color"] = val;
              updatedRow["COLOR"] = val;
            }
            if (key === "COLOR") {
              updatedRow["Color"] = val;
              updatedRow["COLOR"] = val;
            }
            if (key === "SP_PHONE" || key === "SP Phone" || key === "Sp_Phone" || key === "Sp Phone") {
              updatedRow["SP_PHONE"] = val;
              updatedRow["SP Phone"] = val;
              updatedRow["Sp_Phone"] = val;
            }
          }
          return updatedRow;
        }
        return row;
      });

      return {
        ...prev,
        [editEntity]: updatedArray
      };
    });

    setIsEditModalOpen(false);
    showToast(`Updated ${getHumanFriendlyModuleName(editEntity)} entry successfully.`);
  };

  // Register vehicle logic for client-side Customer garage
  const handleCustomerRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegVehicleId) {
      showToast("Please select a vehicle from the drop-down to register", true);
      return;
    }

    // Check if they already own it
    const activeC = currentUser?.id;
    if (!activeC) return;

    const alreadyOwns = db.owned_by.some((ob) => ob.C_ID === activeC && ob.V_ID === selectedRegVehicleId);
    if (alreadyOwns) {
      showToast("This vehicle is already in your garage!", true);
      return;
    }

    setDb((prev) => ({
      ...prev,
      owned_by: [...prev.owned_by, { C_ID: activeC, V_ID: selectedRegVehicleId }]
    }));

    setIsCustRegModalOpen(false);
    showToast("Vehicle registered successfully into your private garage!");
  };

  const handleCustomerRemoveVehicle = (vId: number) => {
    const activeC = currentUser?.id;
    if (!activeC) return;
  
    let proceed = false;
    try {
      proceed = confirm("Are you sure you want to remove this vehicle from your registered fleet?");
    } catch (e) {
      console.warn("confirm blocked by sandbox, defaulting to true", e);
      proceed = true;
    }
    if (!proceed) return;
  
    setDb((prev) => ({
      ...prev,
      owned_by: prev.owned_by.filter((o) => !(o.C_ID === activeC && o.V_ID === vId))
    }));
    showToast("Vehicle removed from your garage");
  };

  // Standard pre-seeding helper calculations for Admin analytics
  const bestSale = [...db.sales].sort((a, b) => b.Units_Sold - a.Units_Sold)[0];
  const bestVehicleModel = bestSale ? db.vehicles.find((v) => v.V_ID === bestSale.V_ID) : null;
  const recentServiceTotal = db.serviced_at.reduce((acc, curr) => acc + curr.Cost, 0);

  return (
    <div className="min-h-screen font-sans bg-[#f7f5f0] text-[#4a4238] flex flex-col selection:bg-[#82937f] selection:text-white">
      {/* Toast Alert popup banner with Natural Tones theme */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-3xl shadow-lg flex items-center gap-3 backdrop-blur-md border ${
              toast.isError
                ? "bg-[#fcf8f2] text-[#a67c52] border-[#e5e0d5]"
                : "bg-white text-[#4a4238] border border-[#e5e0d5]"
            }`}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0 text-[#82937f]" />
            <span className="font-semibold tracking-tight text-xs">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Brand Navigation Header styled according to Natural Tones */}
      <header className="h-20 px-6 sm:px-10 flex items-center justify-between border-b border-[#e8e2d6] bg-[#f7f5f0]/90 backdrop-blur-md sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#82937f] p-2.5 rounded-2xl shadow-sm text-white">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-xl font-black text-[#5a634a]">
                VMS India
              </span>
              <span className="text-[10px] bg-[#efede6] text-[#82937f] border border-[#e5e0d5] px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                PRO v4.1
              </span>
            </div>
            <p className="text-[10px] text-[#9a9286] tracking-widest uppercase font-bold font-mono">
              Vehicle Management Hub
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Session Switcher Widget in Natural Cream Tones */}
        <div className="flex items-center gap-4 flex-wrap">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="bg-[#efede6] px-3.5 py-1.5 rounded-2xl border border-[#e5e0d5] flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#82937f] rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-[#9a9286] uppercase font-bold">Session:</span>
                <span className="text-xs font-bold text-[#4a4238]">{currentUser.label}</span>
              </div>

              {/* Notifications Widget for Admin, Salesperson and Customer roles */}
              {currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson" || currentUser.role === "customer") && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                      isNotificationOpen
                        ? "bg-[#82937f] text-white border-[#82937f]"
                        : "bg-[#efede6] text-[#4a4238] border-[#e5e0d5] hover:bg-[#e8e2d6]/80"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-[11px] font-bold hidden md:inline font-sans">Notifications</span>
                    {(() => {
                      const rel = notifications.filter(n => n.recipientRole === currentUser.role);
                      const unread = rel.filter(n => !n.isRead).length;
                      if (unread === 0) return null;
                      return (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#f7f5f0] shadow-sm animate-pulse">
                          {unread}
                        </span>
                      );
                    })()}
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsNotificationOpen(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-[-10px] sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-h-[82vh] overflow-y-auto bg-white border border-[#e8e2d6] rounded-2xl shadow-2xl p-4 z-50 space-y-4 text-left scrollbar-thin"
                        >
                          <div className="flex items-center justify-between border-b border-[#e8e2d6] pb-2.5">
                            <div>
                              <h4 className="text-xs font-serif font-black text-[#5a634a] uppercase tracking-wide flex items-center gap-1.5">
                                <Bell className="w-4 h-4 text-[#82937f]" />
                                <span>{currentUser.role === "admin" ? "Admin" : currentUser.role === "salesperson" ? "Salesperson" : "Customer"} Console Messages</span>
                              </h4>
                              <p className="text-[10px] text-[#7a736a] mt-0.5">
                                Realtime VMS database dispatch and alerts
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNotifications(prev =>
                                  prev.map(n => n.recipientRole === currentUser.role ? { ...n, isRead: true } : n)
                                );
                                showToast("All items marked as read");
                              }}
                              className="text-[10px] text-[#82937f] hover:text-[#5a634a] font-bold transition-all underline cursor-pointer"
                            >
                              Mark all read
                            </button>
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-3.5 pr-1 hover:pr-0 scrollbar-thin">
                            {(() => {
                              const rel = notifications.filter(n => n.recipientRole === currentUser.role);
                              if (rel.length === 0) {
                                return (
                                  <div className="py-8 text-center text-[#9a9286] text-xs">
                                    Inbox is currently empty.
                                  </div>
                                );
                              }
                              return rel.map((notif) => {
                                const isSelf = notif.senderName.includes(currentUser.name);
                                return (
                                  <div
                                    key={notif.id}
                                    onClick={() => {
                                      setNotifications(prev =>
                                        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
                                      );
                                    }}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                                      notif.isRead
                                        ? "bg-transparent border-[#e5e0d5]/70 opacity-75"
                                        : "bg-[#82937f]/5 border-[#82937f]/30 hover:bg-[#82937f]/10"
                                    }`}
                                  >
                                    {!notif.isRead && (
                                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute top-3 right-3 animate-pulse" />
                                    )}
                                    <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                          notif.type === "booking"
                                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                                            : notif.type === "message"
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            : "bg-gray-100 text-gray-700 border border-gray-200"
                                        }`}>
                                          {notif.type}
                                        </span>
                                        <span className="text-[10px] text-[#9a9286] font-semibold">
                                          From: {notif.senderName}
                                        </span>
                                      </div>
                                      {notif.priority && notif.priority !== "normal" && (
                                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                                          notif.priority === "high"
                                            ? "bg-red-50 border-red-200 text-red-600 font-extrabold"
                                            : "bg-blue-50 border-blue-200 text-blue-600"
                                        }`}>
                                          {notif.priority}
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="text-xs font-bold text-[#4a4238] uppercase tracking-wide">
                                      {notif.title}
                                    </h5>
                                    <p className="text-[11px] text-[#7a736a] mt-1 leading-normal">
                                      {notif.message}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-2.5">
                                      <span className="text-[9px] text-[#9a9286] font-mono">
                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {!isSelf && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (replyingToId === notif.id) {
                                              setReplyingToId(null);
                                            } else {
                                              setReplyingToId(notif.id);
                                              setReplyMsgText("");
                                            }
                                          }}
                                          className="text-[10px] text-[#82937f] hover:text-[#5a634a] font-bold transition-all underline cursor-pointer"
                                        >
                                          {replyingToId === notif.id ? "Cancel Reply" : "Reply"}
                                        </button>
                                      )}
                                    </div>

                                    {replyingToId === notif.id && (
                                      <div
                                        className="mt-2.5 space-y-2 border-t border-[#e5e0d5] pt-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <textarea
                                          value={replyMsgText}
                                          onChange={(e) => setReplyMsgText(e.target.value)}
                                          placeholder={`Reply to ${notif.senderName}...`}
                                          rows={2}
                                          className="w-full bg-[#fcfbfa] border border-[#d6cfb3] rounded-xl py-1 px-2.5 text-xs text-[#4a4238] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                        />
                                        <div className="flex justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setReplyingToId(null)}
                                            className="text-[9px] text-[#7a736a] border border-[#e5e0d5] px-2 py-0.5 rounded cursor-pointer hover:bg-gray-50"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            disabled={!replyMsgText.trim()}
                                            onClick={() => handleSendReply(notif)}
                                            className="text-[9px] bg-[#82937f] hover:bg-[#5a634a] disabled:opacity-50 text-white px-2.5 py-0.5 rounded font-bold cursor-pointer"
                                          >
                                            Send Reply
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Exclusive Admin <-> Salesperson Hotline Option */}
                          {currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson") && (
                            <div className="border-t border-[#e8e2d6] pt-3 px-1 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#718c6d] flex items-center gap-1.5 matches-glow">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#82937f] animate-ping inline-block" />
                                  <span>Admin ⇄ Sales Staff Hotline</span>
                                </h5>
                                <span className="text-[8.5px] font-mono font-bold text-[#82937f] bg-[#82937f]/10 px-1.5 py-0.2 rounded border border-[#82937f]/20">
                                  {currentUser.role === "admin" ? "All Salespersons" : "Admin Desk Only"}
                                </span>
                              </div>

                              <form onSubmit={handleSendAdminSalespersonMessage} className="space-y-1.5">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <select
                                      value={adminSalespersonMsgTopic}
                                      onChange={(e) => setAdminSalespersonMsgTopic(e.target.value)}
                                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-xl py-1 px-1.5 text-[10px] text-[#4a4238] font-medium focus:outline-none focus:ring-1 focus:ring-[#82937f] cursor-pointer"
                                    >
                                      <option value="operational_query">📣 Operational Inquiry</option>
                                      <option value="urgent">⚡ Urgent Staff Warning</option>
                                      <option value="custom">📝 Custom Subject...</option>
                                    </select>
                                  </div>
                                  
                                  <div className="flex gap-1 justify-end items-center">
                                    <span className="text-[8.5px] text-[#7a736a] font-bold font-mono uppercase mr-1">Level:</span>
                                    {["normal", "high"].map((p) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setAdminSalespersonPriority(p)}
                                        className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase transition-all border ${
                                          adminSalespersonPriority === p
                                            ? p === "high"
                                              ? "bg-red-100 border-red-300 text-red-800"
                                              : "bg-[#82937f] border-[#82937f] text-white"
                                            : "bg-[#efede6] border-transparent text-[#7a736a] hover:bg-[#e8e2d6] cursor-pointer"
                                        }`}
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {adminSalespersonMsgTopic === "custom" && (
                                  <div className="animate-fade-in">
                                    <input
                                      type="text"
                                      required
                                      value={adminSalespersonCustomSubject}
                                      onChange={(e) => setAdminSalespersonCustomSubject(e.target.value)}
                                      placeholder="Type custom staff subject line..."
                                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-xl py-1 px-2 text-[10px] text-[#4a4238] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                    />
                                  </div>
                                )}

                                <div className="relative">
                                  <textarea
                                    value={adminSalespersonMsgText}
                                    onChange={(e) => setAdminSalespersonMsgText(e.target.value)}
                                    required
                                    placeholder={
                                      currentUser.role === "admin"
                                        ? "Draft an administrative update or warning to show on salesperson consoles..."
                                        : "Draft an operational report, addition request or query to show on admin consoles..."
                                    }
                                    className="w-full bg-[#efede6] border border-[#e5e0d5] placeholder:text-[#9a9286] rounded-xl py-1 px-2 pr-8 text-[11px] text-[#4a4238] h-12 resize-none focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!adminSalespersonMsgText.trim()}
                                    className="absolute bottom-1.5 right-1.5 bg-[#82937f] hover:bg-[#5a634a] disabled:opacity-50 text-white p-1 rounded-md transition-all cursor-pointer flex items-center justify-center"
                                    title="Send through Hotline"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}

                          {/* Composer Option Form based on Current Role */}
                          {(currentUser.role === "admin" || currentUser.role === "salesperson" || currentUser.role === "customer") && (
                            <div className="border-t border-[#e8e2d6] pt-3.5 space-y-3">
                              {currentUser.role === "salesperson" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#82937f] flex items-center gap-1">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Dispatch Center</span>
                                    </h5>
                                    <div className="flex bg-[#efede6] p-0.5 rounded-lg border border-[#e5e0d5]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setManagerMsgRecipient("admin");
                                          setManagerMsgTopic("check_stock");
                                        }}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                          managerMsgRecipient === "admin"
                                            ? "bg-[#82937f] text-white shadow-sm"
                                            : "text-[#7a736a] hover:text-[#4a4238]"
                                        }`}
                                      >
                                        To Admin
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setManagerMsgRecipient("customer");
                                          setManagerMsgTopic("welcome_msg");
                                        }}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                          managerMsgRecipient === "customer"
                                            ? "bg-[#82937f] text-white shadow-sm"
                                            : "text-[#7a736a] hover:text-[#4a4238]"
                                        }`}
                                      >
                                        To Customer
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[9.5px] text-[#7a736a]">
                                    {managerMsgRecipient === "admin"
                                      ? "Report stock verification inquiries or request catalog revisions."
                                      : "Send direct feedback, incentives, or greeting updates to Arjun Mehta."}
                                  </p>
                                </div>
                              ) : currentUser.role === "customer" ? (
                                <div className="space-y-0.5">
                                  <h5 className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#82937f] flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Inquire with Showroom</span>
                                  </h5>
                                  <p className="text-[9.5px] text-[#7a736a]">
                                    Ask about catalogues details, booking specifications or campaigns.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <h5 className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#82937f] flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Showroom Directives</span>
                                  </h5>
                                  <p className="text-[9.5px] text-[#7a736a]">
                                    Dispatch administrative instructions or monthly dealership objectives.
                                  </p>
                                </div>
                              )}
                              
                              <form onSubmit={handleSendManagerMessage} className="space-y-2.5">
                                <div className="space-y-2">
                                  <div>
                                    <select
                                      value={managerMsgTopic}
                                      onChange={(e) => setManagerMsgTopic(e.target.value)}
                                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-xl py-1.5 px-2.5 text-xs text-[#4a4238] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                    >
                                      {currentUser.role === "customer" && (
                                        <>
                                          <option value="vehicle_enquiry">➕ Inquiry on Catalog Vehicles</option>
                                          <option value="discount_check">💰 Check Special Campaign Offers</option>
                                          <option value="custom">📝 Other Custom Inquiry</option>
                                        </>
                                      )}
                                      {currentUser.role === "admin" && (
                                        <>
                                          <option value="catalog_review">📋 Request Catalog Verification</option>
                                          <option value="sales_targets">📈 Monthly Dealership Objectives</option>
                                          <option value="custom">📝 Custom Administrative Instruction</option>
                                        </>
                                      )}
                                      {currentUser.role === "salesperson" && managerMsgRecipient === "admin" && (
                                        <>
                                          <option value="add_cars">➕ Request Admin to Add New Cars</option>
                                          <option value="check_stock">🔍 Message Admin to Check Stock / Inventory</option>
                                          <option value="custom">📝 Custom Message Subject / Title</option>
                                        </>
                                      )}
                                      {currentUser.role === "salesperson" && managerMsgRecipient === "customer" && (
                                        <>
                                          <option value="welcome_msg">👋 Send Greeting / Proactive Followup</option>
                                          <option value="deal_offer">🏷️ Send Special Direct Discount Offer</option>
                                          <option value="custom">📝 Send Custom details / response</option>
                                        </>
                                      )}
                                    </select>
                                  </div>

                                  {managerMsgTopic === "custom" && (
                                    <div className="animate-fade-in">
                                      <input
                                        type="text"
                                        required
                                        value={managerMsgCustomTitle}
                                        onChange={(e) => setManagerMsgCustomTitle(e.target.value)}
                                        placeholder="Enter custom message subject..."
                                        className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-xl py-1.5 px-2.5 text-xs text-[#4a4238] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] text-[#7a736a] font-bold font-mono uppercase">Priority Level:</span>
                                    <div className="flex gap-1">
                                      {["low", "normal", "high"].map((p) => (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() => setManagerMsgPriority(p)}
                                          className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase transition-all border ${
                                            managerMsgPriority === p
                                              ? p === "high"
                                                ? "bg-red-100 border-red-300 text-red-800"
                                                : p === "low"
                                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                                : "bg-[#82937f] border-[#82937f] text-white"
                                              : "bg-[#efede6] border-transparent text-[#7a736a] hover:bg-[#e8e2d6]"
                                          }`}
                                        >
                                          {p}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="relative">
                                  <textarea
                                    value={managerMsgText}
                                    onChange={(e) => setManagerMsgText(e.target.value)}
                                    required
                                    placeholder={
                                      currentUser.role === "customer"
                                        ? "Type your question or request to the salesperson desk..."
                                        : currentUser.role === "admin"
                                        ? "Type your administrative directive to the showroom team..."
                                        : managerMsgRecipient === "admin"
                                        ? "Inquire if vehicle lines are fully in-stock or booked..."
                                        : "Send direct greetings or special price discounts to Arjun..."
                                    }
                                    className="w-full bg-[#efede6] border border-[#e5e0d5] placeholder:text-[#9a9286] rounded-xl py-1.5 pl-2.5 pr-10 text-xs text-[#4a4238] h-16 resize-none focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!managerMsgText.trim()}
                                    className="absolute bottom-2.5 right-2.5 bg-[#82937f] hover:bg-[#5a634a] disabled:opacity-50 text-white p-1.5 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="bg-[#a67c52]/10 hover:bg-[#a67c52]/20 text-[#a67c52] border border-[#a67c52]/20 transition-all rounded-xl py-2 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#9a9286] font-medium tracking-wide">Please authenticate to activate VMS databases</span>
          )}
        </div>
      </header>

      {/* Main View Grid container */}
      <main className="flex-1 flex flex-col">
        {!currentUser ? (
          /* Authentication Screen (Full styling context matching the HTML mockup provided) */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#f2f0e9]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#e5e0d5] rounded-[32px] p-8 max-w-md w-full shadow-sm relative overflow-hidden"
            >
              {/* Absolutist background accent strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#82937f]" />

              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-[#efede6] rounded-2xl border border-[#e5e0d5] text-[#5a634a] mb-4 shadow-sm">
                  <Car className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-serif font-black text-[#343430] tracking-tight">Vehicles Management</h1>
                <p className="text-[#7a736a] text-xs mt-1.5 font-medium">
                  Active Database Gateway &bull; India Operations &bull; INR
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-[#82937f] mb-1.5 font-bold">
                      Designation Role
                    </label>
                    <select
                      value={selectedStaffRole}
                      onChange={(e) => setSelectedStaffRole(e.target.value as any)}
                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-xl py-2.5 px-3 text-sm text-[#4a4238] focus:outline-none focus:ring-1 focus:ring-[#82937f] focus:border-transparent cursor-pointer font-medium"
                    >
                      <option value="admin">System Administrator (Full access)</option>
                      <option value="salesperson">Salesperson (Add records)</option>
                      <option value="service">Service Crew Expert (Maintain)</option>
                      <option value="customer">🚗 Individual Customer (Explore & Book)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-[#82937f] mb-1.5 font-bold">
                      System Passcode
                    </label>
                    <input
                      type="password"
                      required={selectedStaffRole !== "customer"}
                      disabled={selectedStaffRole === "customer"}
                      value={selectedStaffRole === "customer" ? "" : staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder={selectedStaffRole === "customer" ? "No passcode required for Customer" : "e.g. admin••••, salesperson••••, service••••"}
                      className={`w-full border border-[#e5e0d5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#82937f] ${
                        selectedStaffRole === "customer"
                          ? "bg-[#e5e0d5]/45 text-[#9a9286] cursor-not-allowed"
                          : "bg-[#efede6] text-[#4a4238] placeholder:text-[#9a9286]"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5a634a] hover:bg-[#48503b] text-white py-3 rounded-xl font-bold text-sm tracking-tight transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm"
                >
                  Authenticate Session &rarr;
                </button>

                <div className="pt-3 border-t border-[#f2f0e9] text-center">
                  <p className="text-[#7a736a] text-xs">
                    <span className="text-[#9a9286] block">
                      Staff & customer accounts pre-seeded dynamically for deployment security review.
                    </span>
                  </p>
                </div>
              </form>

              {/* Demo Hint block */}
              <div className="mt-8 pt-4 border-t border-[#f2f0e9] flex justify-between gap-4 text-[10px] text-[#7a736a] bg-[#efede6]/50 p-3.5 rounded-2xl font-mono">
                <div className="w-full text-center">
                  <span className="font-bold text-[#5a634a] block mb-0.5 uppercase tracking-wide">SECURE USER LOGIN DEMO</span>
                  <span className="text-[#7a736a]">
                    Admin Code: <strong className="text-[#5a634a]">admin•••• (Redacted)</strong> &bull; Sales: <strong className="text-[#5a634a]">salesperson•••• (Redacted)</strong> &bull; Service: <strong className="text-[#5a634a]">service•••• (Redacted)</strong> &bull; Customer: <strong className="text-[#5a634a]">No Code</strong>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Active Application View with Sidebar Navigation */
          <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
            {/* Sidebar Navigation Panel with elegant styling */}
            <aside className="w-full md:w-64 border-r border-[#e8e2d6] bg-[#f2f0e9] p-4 shrink-0 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#82937f] tracking-widest font-mono font-black uppercase inline-block mb-3 px-2">
                  Navigations
                </span>
                <nav className="space-y-1">
                  {/* Common Dashboard */}
                  <button
                    onClick={() => {
                      setCurrentModule("dashboard");
                      showToast("Loaded Dashboard Analytics");
                    }}
                    className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                      currentModule === "dashboard"
                        ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                        : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#82937f]" />
                    <span>Dashboard Stats</span>
                  </button>

                  {/* Dynamic Catalog Section in "Available Vehicles" */}
                  <button
                    onClick={() => {
                      setCurrentModule("available_vehicles");
                      showToast("Open Available Vehicles Structured Catalog Section");
                    }}
                    className={`nav-button-custom w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                      currentModule === "available_vehicles"
                        ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                        : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-[#82937f]" />
                      <span>Available Vehicles</span>
                    </span>
                    <span className="bg-[#82937f] text-white px-1.5 py-0.5 text-[8px] uppercase tracking-wider rounded-full font-bold">
                      Catalog
                    </span>
                  </button>

                  {/* Customer specific panels */}
                  {currentUser.role === "customer" && (
                    <>
                      <button
                        onClick={() => {
                          setCurrentModule("service_centres");
                          showToast("Loaded Services locator");
                        }}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "service_centres"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-[#82937f]" />
                        <span>Service Outlets</span>
                      </button>
                    </>
                  )}

                  {/* Admin & Salesperson Restricted DB views */}
                  {(currentUser.role === "admin" || currentUser.role === "salesperson") && (
                    <>
                      <span className="text-[10px] text-[#82937f] tracking-widest font-mono font-bold uppercase inline-block pt-4 pb-2 px-2">
                        Operations DB
                      </span>
                      <button
                        onClick={() => setCurrentModule("vehicles")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "vehicles"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Car className="w-4 h-4 text-[#82937f]" />
                        <span>Vehicles Registered ({db.vehicles.length})</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("customers")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "customers"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Users className="w-4 h-4 text-[#82937f]" />
                        <span>Customers List ({db.customers.length})</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("customer_phone")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "customer_phone"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Phone className="w-4 h-4 text-[#82937f]" />
                        <span>Customer Phone ({db.customer_phone?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("sales")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "sales"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Handshake className="w-4 h-4 text-[#82937f]" />
                        <span>Sales Registry ({db.sales.length})</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("sales_id_records")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "sales_id_records"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Hash className="w-4 h-4 text-[#82937f]" />
                        <span>Sales ID Records ({db.sales_id_records?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("sales_phone")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "sales_phone"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Phone className="w-4 h-4 text-[#82937f]" />
                        <span>Salesperson Contact ({db.sales_phone?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("owned_by")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "owned_by"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Award className="w-4 h-4 text-[#82937f]" />
                        <span>Ownership Matrix</span>
                      </button>
                    </>
                  )}

                  {/* Admin & Service Expert Specific views */}
                  {(currentUser.role === "admin" || currentUser.role === "service") && (
                    <>
                      <span className="text-[10px] text-[#82937f] tracking-widest font-mono font-bold uppercase inline-block pt-4 pb-2 px-2">
                        Maintenance System
                      </span>
                      <button
                        onClick={() => setCurrentModule("service_phone")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "service_phone"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Wrench className="w-4 h-4 text-[#82937f]" />
                        <span>Authorized Centres</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("serviced_at")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "serviced_at"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <FileText className="w-4 h-4 text-[#82937f]" />
                        <span>Maintenance Logs</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("service_centre")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "service_centre"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Car className="w-4 h-4 text-[#82937f]" />
                        <span>Vehicles Serviced</span>
                      </button>
                    </>
                  )}

                  {/* System Admin only exclusive schemas */}
                  {currentUser.role === "admin" && (
                    <>
                      <span className="text-[10px] text-[#82937f] tracking-widest font-mono font-bold uppercase inline-block pt-4 pb-2 px-2">
                        Admin Aux Schemas
                      </span>
                      <button
                        onClick={() => setCurrentModule("manufacturers")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "manufacturers"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Globe className="w-4 h-4 text-[#82937f]" />
                        <span>Manufacturers List</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("vehicle_color")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "vehicle_color"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Palette className="w-4 h-4 text-[#82937f]" />
                        <span>Vehicle Colors Map</span>
                      </button>
                      <button
                        onClick={() => setCurrentModule("socials")}
                        className={`nav-button-custom w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          currentModule === "socials"
                            ? "bg-[#82937f]/10 text-[#5a634a] border-l-4 border-[#82937f]"
                            : "text-[#7a736a] hover:bg-[#e8e2d6]/40 hover:text-[#343430]"
                        }`}
                      >
                        <Activity className="w-4 h-4 text-[#82937f]" />
                        <span>Social Handlers</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>

              {/* Dev notice footer block */}
              <div className="pt-4 border-t border-slate-900/80 text-[10px] text-slate-500 font-mono tracking-tight leading-relaxed">
                <span className="font-extrabold text-slate-400 inline-block mb-1">
                  Database Constraints:
                </span>
                <p>Standard SQL joins simulated natively. Location markers linked across Mumbai, Delhi & Bangalore.</p>
              </div>
            </aside>

            {/* Main Interactive Dynamic Workspace Content Panel */}
            <div className="flex-1 bg-[#fcfbf9] p-6 md:p-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentModule === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#e8e2d6] pb-4">
                      <div>
                        <h2 className="text-2xl font-serif font-black text-[#343430] tracking-tight">Overview Dashboard</h2>
                        <p className="text-[#7a736a] text-xs">VMS Enterprise Live Operational Metrics - India</p>
                      </div>
                      <div className="flex items-center gap-2 bg-[#82937f]/10 border border-[#82937f]/20 px-3.5 py-1.5 rounded-xl">
                        <TrendingUp className="w-4 h-4 text-[#5a634a]" />
                        <span className="text-xs font-mono font-bold text-[#5a634a]">STATUS: LIVE CONNECTED</span>
                      </div>
                    </div>

                    {/* Numeric analytical summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-[#e8e2d6] p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-xs text-[#7a736a] font-bold uppercase tracking-wider">
                            Total Inventory
                          </span>
                          <h3 className="text-3xl font-serif font-black text-[#343430] mt-1">{db.vehicles.length}</h3>
                          <span className="text-[10px] text-[#9a9286]">Active Models in DB</span>
                        </div>
                        <div className="bg-[#82937f]/10 p-3.5 rounded-xl text-[#82937f]">
                          <Car className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="bg-white border border-[#e8e2d6] p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-xs text-[#7a736a] font-bold uppercase tracking-wider">
                            Registered Customers
                          </span>
                          <h3 className="text-3xl font-serif font-black text-[#343430] mt-1">{db.customers.length}</h3>
                          <span className="text-[10px] text-[#9a9286]">Secured client directories</span>
                        </div>
                        <div className="bg-[#5a634a]/10 p-3.5 rounded-xl text-[#5a634a]">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="bg-white border border-[#e8e2d6] p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-xs text-[#7a736a] font-bold uppercase tracking-wider">
                            Best Seller Model
                          </span>
                          <h3 className="text-lg font-serif font-black text-[#343430] mt-1 truncate max-w-[150px]">
                            {bestVehicleModel ? bestVehicleModel.Model : "Swift"}
                          </h3>
                          <span className="text-[10px] text-[#9a9286]">
                            {bestSale ? `${bestSale.Units_Sold} cumulative units` : "N/A"}
                          </span>
                        </div>
                        <div className="bg-[#a67c52]/10 p-3.5 rounded-xl text-[#a67c52]">
                          <Award className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="bg-white border border-[#e8e2d6] p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-xs text-[#7a736a] font-bold uppercase tracking-wider">
                            Maintenance Cost
                          </span>
                          <h3 className="text-lg font-serif font-black text-[#343430] mt-1">
                            ₹{recentServiceTotal.toLocaleString("en-IN")}
                          </h3>
                          <span className="text-[10px] text-[#9a9286]">Aggregate Service Bill</span>
                        </div>
                        <div className="bg-[#a67c52]/10 p-3.5 rounded-xl text-[#a67c52]">
                          <Wrench className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    {/* Operational Highlights panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-white border border-[#e8e2d6] rounded-2xl p-6 lg:col-span-2 shadow-xs">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-5 h-5 text-[#82937f]" />
                          <h4 className="font-serif font-bold text-[#343430]">Live Showroom Highlights</h4>
                        </div>
                        <p className="text-[#4a4238] text-sm leading-relaxed">
                          Welcome to the role-based Indian Vehicle Registry portal. Access real-time specifications of
                          passenger vehicles and commercial fleets across local distributors. To complete the "Available
                          Vehicles" specification extraction tasks, head over to the catalog tab on the sidebar.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4">
                          <button
                            onClick={() => setCurrentModule("available_vehicles")}
                            className="bg-[#82937f] hover:bg-[#5a634a] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Unlock Extracted Vehicle Catalog</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border border-[#e8e2d6] rounded-2xl p-6 shadow-xs">
                        <h4 className="font-serif font-bold text-[#343430] mb-3">VMS Quick-Help</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2.5 text-xs text-[#7a736a]">
                            <span className="text-[#82937f] font-black font-mono">1.</span>
                            <p>
                              Change your account representation above to dynamically update viewing permissions.
                            </p>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs text-[#7a736a]">
                            <span className="text-[#82937f] font-black font-mono">2.</span>
                            <p>
                              System admin can live-create entries in all relational tables simulating direct SQL joins.
                            </p>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs text-[#7a736a]">
                            <span className="text-[#82937f] font-black font-mono">3.</span>
                            <p>
                              All prices are modeled carefully in Indian Rupees (INR) adapting local guidelines.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AVAILABLE VEHICLES: Highly Styled Dropdown Catalog Section */}
                {currentModule === "available_vehicles" && (
                  <motion.div
                    key="available_vehicles"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-[#e8e2d6] pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h2 className="text-2xl font-serif font-black text-[#343430] tracking-tight flex items-center gap-2">
                            <span>Available Vehicles</span>
                            <span className="text-xs bg-[#82937f]/10 text-[#5a634a] border border-[#82937f]/20 py-0.5 px-2 rounded-full uppercase font-mono tracking-wider">
                              Hand-Analysed Archive
                            </span>
                          </h2>
                          <p className="text-[#7a736a] text-xs mt-0.5">
                            Extract descriptions in detail & bulls-eye web searched metadata
                          </p>
                        </div>

                        {/* Interactive Dynamic filter matching customer search input */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-[#7a736a] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search catalog models..."
                            value={catalogSearchTerm}
                            onChange={(e) => setCatalogSearchTerm(e.target.value)}
                            className="bg-[#efede6] border border-[#e5e0d5] placeholder:text-[#9a9286] rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#82937f] min-w-[200px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 1 Input: Dropdown list of vehicle companies displayed horizontally or drop list */}
                    <div className="bg-white border border-[#e8e2d6] p-5 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#82937f]" />
                        <span className="text-xs uppercase font-mono font-bold text-[#4a4238]">
                          Select Manufacturer Catalog (Total 19 Companies from PDF)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
                        {AUTO_COMPANIES.map((company) => (
                          <button
                            key={company.name}
                            onClick={() => selectBrand(company.name)}
                            className={`py-2 px-3 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedCatalogBrand === company.name
                                ? "bg-[#82937f] text-white font-black shadow-md ring-2 ring-[#82937f]/30 scale-105"
                                : "bg-[#efede6]/80 border border-[#e5e0d5] hover:border-[#82937f]/40 text-[#4a4238]"
                            }`}
                          >
                            <span className="text-lg">{company.logo}</span>
                            <span className="text-[10px] tracking-tight truncate w-full font-bold">
                              {company.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Extract & Analyze simulation Loader feedback */}
                    {isExtracting ? (
                      <div className="py-24 text-center space-y-4 bg-white border border-[#e8e2d6] rounded-3xl shadow-xs">
                        <div className="relative w-12 h-12 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-[#82937f]/10" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-[#82937f] border-l-[#82937f] animate-spin" />
                        </div>
                        <div>
                          <p className="text-[#343430] text-sm font-bold font-mono">
                            IDENTIFYING &amp; EXTRACTING SPECIFICATIONS...
                          </p>
                          <p className="text-[#7a736a] text-xs mt-1">
                            Analyzing visual identifiers, badges &amp; conducting web search triangulation &bull; {selectedCatalogBrand}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Display extracted catalog data */
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {/* Company Banner and general summary parameters */}
                        {(() => {
                          const catalog = getCatalogForSelectedBrand();
                          const filteredVehicles = catalog.vehicles.filter((v) =>
                            v.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
                            v.category.toLowerCase().includes(catalogSearchTerm.toLowerCase())
                          );

                          return (
                            <>
                              <div className="relative rounded-3xl overflow-hidden border border-[#e5e0d5] h-44 sm:h-52 select-none">
                                <img
                                  src={catalog.bannerUrl}
                                  alt={catalog.companyName}
                                  className="w-full h-full object-cover brightness-50"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#4a4238] via-[#4a4238]/45 to-transparent" />
                                
                                {currentUser && currentUser.role !== "customer" && (
                                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setIsAddCatalogVehicleOpen(true)}
                                      className="bg-[#5a634a]/90 hover:bg-[#434b36] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md select-none flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add New Vehicle</span>
                                    </button>
                                    <label className="bg-[#82937f]/90 hover:bg-[#5a634a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md select-none flex items-center gap-1">
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Upload Brand Banner</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              if (typeof reader.result === "string") {
                                                handleUploadCompanyBanner(selectedCatalogBrand, reader.result);
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleResetCatalog(selectedCatalogBrand)}
                                      className="bg-red-800/90 hover:bg-red-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md select-none flex items-center gap-1"
                                    >
                                      <span>Reset Brand</span>
                                    </button>
                                  </div>
                                )}
                                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between flex-wrap gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Globe className="w-4 h-4 text-[#82937f]" />
                                      <span className="text-xs uppercase font-mono tracking-widest text-[#e8e2d6] font-bold">
                                        Origin: {catalog.originCountry}
                                      </span>
                                    </div>
                                    <h3 className="text-3xl font-serif font-black text-white tracking-tight">
                                      {catalog.companyName} Catalog
                                    </h3>
                                  </div>
                                  <p className="text-[#e2ded5] text-xs max-w-xl line-clamp-2 bg-[#4a4238]/60 backdrop-blur-sm p-3 rounded-xl border border-[#e5e0d5]/20">
                                    {catalog.description}
                                  </p>
                                </div>
                              </div>

                              {filteredVehicles.length === 0 ? (
                                <div className="text-center py-16 text-[#7a736a] text-xs border border-[#e8e2d6] rounded-3xl bg-white">
                                  No catalog entries found for your query. Try searching models like "Aventador",
                                  "Swift", or "Kylaq".
                                </div>
                              ) : (
                                <div className="space-y-8">
                                  {filteredVehicles.map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="bg-white border border-[#e8e2d6] rounded-3xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start shadow-xs"
                                    >
                                      {/* Left block photo and meta tag */}
                                      <div className="lg:col-span-4 space-y-4">
                                        <div className="relative rounded-2xl overflow-hidden bg-[#efede6] border border-[#e5e0d5] group h-52 sm:h-60">
                                          <img
                                            src={entry.imageUrl}
                                            alt={entry.name}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                                          />
                                          <div className="absolute top-3 left-3 bg-[#f7f5f0]/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#5a634a] border border-[#e5e0d5] shadow-sm">
                                            {entry.category}
                                          </div>
                                          {currentUser && currentUser.role !== "customer" && (
                                            <div className="absolute bottom-3 right-3 z-10">
                                              <label className="bg-[#82937f]/95 hover:bg-[#5a634a] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-lg select-none flex items-center gap-1 active:scale-95">
                                                <Upload className="w-3 h-3" />
                                                <span>Upload Photo</span>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  className="hidden"
                                                  onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      const reader = new FileReader();
                                                      reader.onloadend = () => {
                                                        if (typeof reader.result === "string") {
                                                          handleUploadVehicleImage(selectedCatalogBrand, entry.id, reader.result);
                                                        }
                                                      };
                                                      reader.readAsDataURL(file);
                                                    }
                                                  }}
                                                />
                                              </label>
                                            </div>
                                          )}
                                        </div>

                                        {/* Technical extraction metadata container */}
                                        <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#e5e0d5] space-y-2 text-xs font-mono">
                                          <span className="text-[10px] uppercase font-bold text-[#82937f] flex items-center gap-2">
                                            <Database className="w-3.5 h-3.5" />
                                            Image Extraction Metadata
                                          </span>
                                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                            <div>
                                              <span className="text-[#9a9286] block">Resolution:</span>
                                              <span className="text-[#4a4238] font-bold">{entry.metadata.resolution}</span>
                                            </div>
                                            <div>
                                              <span className="text-[#9a9286] block">File Type:</span>
                                              <span className="text-[#4a4238] font-bold">{entry.metadata.fileType}</span>
                                            </div>
                                            <div>
                                              <span className="text-[#9a9286] block">Date Retrieved:</span>
                                              <span className="text-[#4a4238] font-bold">{entry.metadata.dateAccessed}</span>
                                            </div>
                                            <div>
                                              <span className="text-[#9a9286] block">Pipeline Source:</span>
                                              <span className="text-[#4a4238] truncate block font-bold">
                                                {entry.metadata.sourceType}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right specifications catalog layout block */}
                                      <div className="lg:col-span-8 space-y-6">
                                        {editingVehicleId === entry.id ? (
                                          <form
                                            onSubmit={(e) => {
                                              e.preventDefault();
                                              handleSaveEditSubmit(selectedCatalogBrand, entry.id);
                                            }}
                                            className="space-y-4 bg-[#fcfbfa] border border-[#d6cfb3] p-6 rounded-2xl shadow-sm text-left animate-fade-in"
                                          >
                                            <div className="flex items-center justify-between border-b border-[#e5e0d5] pb-3 mb-2">
                                              <span className="text-[11px] font-mono font-black text-[#5a634a] uppercase tracking-wider flex items-center gap-1.5">
                                                <Pencil className="w-3.5 h-3.5" />
                                                Rectify Catalog Listing Details
                                              </span>
                                              <span className="text-[10px] font-mono text-[#a68a52] uppercase font-bold bg-white border border-[#e5e0d5] px-2 py-0.5 rounded">ID: {entry.id}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {/* Vehicle Name */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Vehicle Display Title
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatName}
                                                  onChange={(e) => setEditCatName(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Category */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Category
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatCategory}
                                                  onChange={(e) => setEditCatCategory(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Price Range */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Price Range
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatPrice}
                                                  onChange={(e) => setEditCatPrice(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Source Origin */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Source Origin
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatSource}
                                                  onChange={(e) => setEditCatSource(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Engine */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Engine / Power specs
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatEngine}
                                                  onChange={(e) => setEditCatEngine(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Transmission */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Transmission / Drivetrain
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatTransmission}
                                                  onChange={(e) => setEditCatTransmission(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Dimensions */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Dimensions / Form Parameters
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatDimensions}
                                                  onChange={(e) => setEditCatDimensions(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>

                                              {/* Fuel Type */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Fuel / Energy Type
                                                </label>
                                                <input
                                                  required
                                                  type="text"
                                                  value={editCatFuelType}
                                                  onChange={(e) => setEditCatFuelType(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                />
                                              </div>
                                            </div>

                                            <div className="space-y-3 mt-3">
                                              {/* Custom Design Highlights */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Visual Design Keys (Separated by commas)
                                                </label>
                                                <textarea
                                                  value={editCatDesign}
                                                  onChange={(e) => setEditCatDesign(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] h-12 focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                  placeholder="Item 1, Item 2..."
                                                />
                                              </div>

                                              {/* Custom Safety Highlights */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Chassis &amp; Safety Keys (Separated by commas)
                                                </label>
                                                <textarea
                                                  value={editCatSafety}
                                                  onChange={(e) => setEditCatSafety(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] h-12 focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                  placeholder="Item 1, Item 2..."
                                                />
                                              </div>

                                              {/* Custom Tech Highlights */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  On-Board Tech Keys (Separated by commas)
                                                </label>
                                                <textarea
                                                  value={editCatTech}
                                                  onChange={(e) => setEditCatTech(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] h-12 focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                  placeholder="Item 1, Item 2..."
                                                />
                                              </div>

                                              {/* Visible Badges */}
                                              <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                                                  Visible Text &amp; Badges (Separated by commas)
                                                </label>
                                                <textarea
                                                  value={editCatBadges}
                                                  onChange={(e) => setEditCatBadges(e.target.value)}
                                                  className="w-full bg-white border border-[#e5e0d5] rounded-xl py-2 px-3 text-xs text-[#343430] h-12 focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                                                  placeholder="Badge 1, Badge 2..."
                                                />
                                              </div>
                                            </div>

                                            {/* Submit & Cancel triggers */}
                                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#e5e0d5] mt-4">
                                              <button
                                                type="button"
                                                onClick={() => setEditingVehicleId(null)}
                                                className="px-4 py-2 bg-[#efede6] hover:bg-[#e5e0d5] text-[#4a4238] rounded-xl text-xs font-bold transition-all cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="submit"
                                                className="px-5 py-2 bg-[#82937f] hover:bg-[#5a634a] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                                              >
                                                <Shield className="w-3.5 h-3.5" />
                                                Save Verification Update
                                              </button>
                                            </div>
                                          </form>
                                        ) : (
                                          <>
                                            <div className="flex justify-between items-start gap-4 flex-wrap">
                                              <div>
                                                <span className="text-xs font-mono text-[#82937f] uppercase tracking-widest font-bold">
                                                  Detailed Analysis Profile
                                                </span>
                                                <h4 className="text-2xl font-serif font-black text-[#343430] tracking-tight mt-0.5">
                                                  {entry.name}
                                                </h4>
                                              </div>
                                              {currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson") && (
                                                <button
                                                  onClick={() => handleStartEdit(entry)}
                                                  type="button"
                                                  className="bg-[#82937f] hover:bg-[#5a634a] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                                                >
                                                  <Edit className="w-3.5 h-3.5" />
                                                  <span>Edit Details</span>
                                                </button>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                              <span className="text-xs bg-[#82937f]/10 text-[#5a634a] border border-[#82937f]/20 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                                                INR pricing: {entry.priceRange}
                                              </span>
                                              <span className="text-xs text-[#7a736a]">
                                                Source:{" "}
                                                <span className="text-[#5a634a] font-medium underline">
                                                  {entry.sourceOrigin}
                                                </span>
                                              </span>
                                            </div>

                                            {/* Dynamic Specifications grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f7f5f0] border border-[#e5e0d5] p-5 rounded-2xl">
                                              <div>
                                                <span className="text-[10px] text-[#9a9286] uppercase font-mono tracking-wider block font-bold">
                                                  Engine / Power
                                                </span>
                                                <span className="text-xs text-[#4a4238] font-bold leading-relaxed mt-1 block">
                                                  {entry.specifications.engine}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-[#9a9286] uppercase font-mono tracking-wider block font-bold">
                                                  Transmission / Drivetrain
                                                </span>
                                                <span className="text-xs text-[#4a4238] font-bold leading-relaxed mt-1 block">
                                                  {entry.specifications.transmission}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-[#9a9286] uppercase font-mono tracking-wider block font-bold">
                                                  Form Parameters
                                                </span>
                                                <span className="text-xs text-[#4a4238] font-bold leading-relaxed mt-1 block">
                                                  {entry.specifications.dimensions}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-[#9a9286] uppercase font-mono tracking-wider block font-bold">
                                                  Fuel / Energy
                                                </span>
                                                <span className="text-xs text-[#4a4238] font-bold leading-relaxed mt-1 block">
                                                  {entry.specifications.fuelType}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Key extracted highlighting lists (Tabs or columns) */}
                                            <div>
                                              <span className="text-xs text-[#7a736a] uppercase font-mono font-bold tracking-wider block mb-3">
                                                Extract highlighting parameters:
                                              </span>
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-[#f7f5f0] border border-[#e5e0d5] p-4 rounded-xl space-y-2">
                                                  <h5 className="text-[10px] uppercase font-bold text-[#5a634a] font-mono tracking-wide">
                                                    Visual Design Key
                                                  </h5>
                                                  <ul className="space-y-1.5 text-xs text-[#4a4238]">
                                                    {entry.keyFeatures.design.map((item, id) => (
                                                      <li key={id} className="flex gap-2">
                                                        <span className="text-[#5a634a] font-bold">&bull;</span>
                                                        <span>{item}</span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>

                                                <div className="bg-[#f7f5f0] border border-[#e5e0d5] p-4 rounded-xl space-y-2">
                                                  <h5 className="text-[10px] uppercase font-bold text-[#a67c52] font-mono tracking-wide">
                                                    Chassis &amp; Safety
                                                  </h5>
                                                  <ul className="space-y-1.5 text-xs text-[#4a4238]">
                                                    {entry.keyFeatures.safety.map((item, id) => (
                                                      <li key={id} className="flex gap-2">
                                                        <span className="text-[#a67c52] font-bold">&bull;</span>
                                                        <span>{item}</span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>

                                                <div className="bg-[#f7f5f0] border border-[#e5e0d5] p-4 rounded-xl space-y-2">
                                                  <h5 className="text-[10px] uppercase font-bold text-[#82937f] font-mono tracking-wide">
                                                    On-Board Tech
                                                  </h5>
                                                  <ul className="space-y-1.5 text-xs text-[#4a4238]">
                                                    {entry.keyFeatures.technology.map((item, id) => (
                                                      <li key={id} className="flex gap-2">
                                                        <span className="text-[#82937f] font-bold">&bull;</span>
                                                        <span>{item}</span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Badges identified inside original design screenshots */}
                                            <div>
                                              <span className="text-xs text-[#7a736a] uppercase font-mono font-bold tracking-wider block mb-2">
                                                Visible text &amp; badges identified in scan:
                                              </span>
                                              <div className="flex flex-wrap gap-2">
                                                {entry.visibleBadges.map((badge, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="bg-[#f7f5f0] text-[#343430] border border-[#e5e0d5] text-[10px] font-mono font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 uppercase shadow-sm"
                                                  >
                                                    <Hash className="w-3.5 h-3.5 text-[#82937f]" />
                                                    {badge}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </>
                                        )}

                                        {/* Interior/Exterior specific view details section */}
                                        {((entry.interiorExteriorDetails && entry.interiorExteriorDetails.length > 0) || (currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson"))) && (
                                          <div className="border-t border-[#e8e2d6] pt-4 mt-6">
                                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                              <span className="text-xs text-[#9a9286] uppercase font-mono font-black block">
                                                Interior / Exterior specific views
                                              </span>
                                              {currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson") && (
                                                <span className="text-[10px] text-[#82937f] tracking-wider font-mono font-bold bg-[#82937f]/5 px-2 py-0.5 rounded border border-[#82937f]/20 uppercase">
                                                  Photo Uplink Hub Active
                                                </span>
                                              )}
                                            </div>

                                            {entry.interiorExteriorDetails && entry.interiorExteriorDetails.length > 0 ? (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {entry.interiorExteriorDetails.map((view, vIdx) => (
                                                  <div
                                                    key={vIdx}
                                                    className="bg-[#f7f5f0] rounded-2xl p-4 border border-[#e5e0d5] space-y-3 relative group"
                                                  >
                                                    <div className="h-28 rounded-xl overflow-hidden bg-[#efede6] border border-[#e5e0d5] select-none relative">
                                                      <img
                                                        src={view.imageUrl}
                                                        alt={view.title}
                                                        className="w-full h-full object-cover"
                                                      />
                                                      {currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson") && (
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setCatalogs(prev => {
                                                              const currentBrandCatalog = prev[selectedCatalogBrand] || getCatalogForSelectedBrandRaw(selectedCatalogBrand);
                                                              const next = {
                                                                ...prev,
                                                                [selectedCatalogBrand]: {
                                                                  ...currentBrandCatalog,
                                                                  vehicles: currentBrandCatalog.vehicles.map((v) => {
                                                                    if (v.id === entry.id) {
                                                                      return {
                                                                        ...v,
                                                                        interiorExteriorDetails: (v.interiorExteriorDetails || []).filter((_, i) => i !== vIdx)
                                                                      };
                                                                    }
                                                                    return v;
                                                                  })
                                                                }
                                                              };
                                                              localStorage.setItem("vms_vehicle_catalogs_v2", JSON.stringify(next));
                                                              return next;
                                                            });
                                                            showToast("Photo deleted successfully!");
                                                          }}
                                                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-[9px] font-bold shadow-md cursor-pointer transition-all hidden group-hover:block"
                                                        >
                                                          Remove
                                                        </button>
                                                      )}
                                                    </div>
                                                    <div>
                                                      <h5 className="text-xs font-serif font-bold text-[#343430] flex items-center justify-between">
                                                        <span>{view.title}</span>
                                                        <span className={`text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded font-mono ${
                                                          view.title.toLowerCase().includes("interior")
                                                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                                                            : "bg-blue-100 text-blue-800 border border-blue-200"
                                                        }`}>
                                                          {view.title.toLowerCase().includes("interior") ? "Interior" : "Exterior"}
                                                        </span>
                                                      </h5>
                                                      <p className="text-[10px] text-[#7a736a] leading-normal mt-1">
                                                        {view.description}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="py-4 text-center text-[#9a9286] text-[11px] bg-[#f7f5f0] rounded-2xl border border-[#e5e0d5] border-dashed">
                                                No custom perspective views uploaded yet. Use the upload forms below to establish beautiful gallery views.
                                              </div>
                                            )}

                                            {/* Symmetrical Inline Upload Feature for Interior/Exterior */}
                                            {currentUser && (currentUser.role === "admin" || currentUser.role === "salesperson") && (
                                              <div className="mt-4 bg-[#fcfbfa] border border-[#e5e0d5] rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[11px] font-bold text-[#5a634a] font-serif uppercase tracking-wider flex items-center gap-1.5">
                                                    <Plus className="w-3.5 h-3.5 text-[#81947f]" />
                                                    Add New Perspective Design Shot
                                                  </span>
                                                  <span className="text-[9px] font-mono text-[#7a736a]">
                                                    Supported formats: JPG, PNG, WEBP
                                                  </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                  {/* Interior Upload Block */}
                                                  <label className="border border-dashed border-[#e5e0d5] hover:border-[#82937f]/60 bg-white/70 hover:bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xs group text-center min-h-[90px]">
                                                    <Upload className="w-5 h-5 text-[#82937f] mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[11px] font-bold text-[#4a4238]">Upload Interior View</span>
                                                    <span className="text-[9px] text-[#7a736a] mt-0.5">Dashboard, Cabin, Seating</span>
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      className="hidden"
                                                      onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                          const reader = new FileReader();
                                                          reader.onloadend = () => {
                                                            if (typeof reader.result === "string") {
                                                              const desc = prompt("Enter a brief description for this Interior image (optional):", "Premium spacious interior cabin with executive leather finish & custom climate zoning.");
                                                              handleUploadInteriorExterior(selectedCatalogBrand, entry.id, "Interior", reader.result, desc || "");
                                                            }
                                                          };
                                                          reader.readAsDataURL(file);
                                                        }
                                                      }}
                                                    />
                                                  </label>

                                                  {/* Exterior Upload Block */}
                                                  <label className="border border-dashed border-[#e5e0d5] hover:border-[#82937f]/60 bg-white/70 hover:bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xs group text-center min-h-[90px]">
                                                    <Upload className="w-5 h-5 text-[#82937f] mb-1 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[11px] font-bold text-[#4a4238]">Upload Exterior View</span>
                                                    <span className="text-[9px] text-[#7a736a] mt-0.5">Side profile, Grille, Alloy Wheels</span>
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      className="hidden"
                                                      onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                          const reader = new FileReader();
                                                          reader.onloadend = () => {
                                                            if (typeof reader.result === "string") {
                                                              const desc = prompt("Enter a brief description for this Exterior image (optional):", "Athletic aerodynamic side-profile and diamond-cut lightweight alloy wheels.");
                                                              handleUploadInteriorExterior(selectedCatalogBrand, entry.id, "Exterior", reader.result, desc || "");
                                                            }
                                                          };
                                                          reader.readAsDataURL(file);
                                                        }
                                                      }}
                                                    />
                                                  </label>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Premium Direct Customer Booking Option Section */}
                                        <div className="border-t border-[#e8e2d6] pt-5 mt-6 flex items-center justify-between flex-wrap gap-4 bg-[#fcfbfa] p-4 rounded-2xl border border-[#ede9e2]">
                                          <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#82937f] font-bold block">
                                              India Dealership &bull; Real-time Booking
                                            </span>
                                            <h5 className="text-sm font-bold text-[#4a4238] flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full bg-[#82937f] animate-pulse" />
                                              <span>Immediate Allocation Active</span>
                                            </h5>
                                            <p className="text-[11px] text-[#7a736a]">
                                              Lock in your delivery priority queue. Bookings are fully refundable within 48 hours.
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleBookVehicle(entry.name)}
                                            className="bg-[#82937f] hover:bg-[#5a634a] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer select-none"
                                          >
                                            <Car className="w-4 h-4" />
                                            <span>Book Now</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* MY GARAGE: Customer specific registered vehicles display */}
                {currentUser.role === "customer" && currentModule === "my_vehicles" && (
                  <motion.div
                    key="my_vehicles"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#e8e2d6] pb-4">
                      <div>
                        <h2 className="text-2xl font-serif font-black text-[#343430] tracking-tight">🔐 My Licensed Garage</h2>
                        <p className="text-[#7a736a] text-xs">Vehicles currently registered under your ownership name</p>
                      </div>
                    </div>

                    {getMyVehicles().length === 0 ? (
                      <div className="bg-[#efede6]/50 border border-[#e8e2d6] rounded-3xl p-12 text-center text-[#7a736a] space-y-4 shadow-xs">
                        <Shield className="w-12 h-12 text-[#82937f] mx-auto" />
                        <div>
                          <p className="font-bold text-[#343430]">Your Indian Garage is currently empty</p>
                          <p className="text-xs leading-normal max-w-sm mx-auto mt-1">
                            Please contact an authorised dealer or system administrator to link registered vehicle specifications
                            under your ownership name and security PIN.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-[#e8e2d6] rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#f2f0e9] text-[#5a634a] uppercase font-mono text-[10px] tracking-wider border-b border-[#e8e2d6]">
                              <th className="p-4">Model Description</th>
                              <th className="p-4">Engine / VIN Number</th>
                              <th className="p-4">Reg Indian Number</th>
                              <th className="p-4">Body Configuration</th>
                              <th className="p-4">Est. Valuation</th>
                              <th className="p-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e8e2d6]">
                            {getMyVehicles().map((v) => (
                              <tr key={v.V_ID} className="hover:bg-[#f7f5f0] transition-colors">
                                <td className="p-4">
                                  <div>
                                    <span className="font-extrabold text-[#343430] block">{v.Model}</span>
                                    <span className="text-[10px] text-[#7a736a]">{getManuName(v.M_ID)}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono font-bold text-[#343430] bg-[#f7f5f0] py-0.5 px-2 rounded border border-[#e5e0d5]">
                                    {v.VIN}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono text-[#4a4238] font-semibold">{v.Reg_NO}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-[#4a4238] font-medium">{v.VEHICLE_TYPE || v.Vehicle_type}</span>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono text-[#5a634a] font-bold">
                                    ₹{v.Price.toLocaleString("en-IN")}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleCustomerRemoveVehicle(v.V_ID)}
                                    className="text-red-600 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-200 transition-all font-semibold font-mono text-[10px] cursor-pointer"
                                  >
                                    De-register
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* SERVICE OUTLETS: Customer View Map Locators */}
                {currentUser.role === "customer" && currentModule === "service_centres" && (
                  <motion.div
                    key="service_centres"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-[#e8e2d6] pb-4">
                      <h2 className="text-2xl font-serif font-black text-[#343430] tracking-tight">📍 Connected Service Outlets</h2>
                      <p className="text-[#7a736a] text-xs mt-0.5">
                        Authorised outlets connected to operations database for repairs
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {db.service_centre.map((sc) => {
                        const phoneInfo = db.service_phone.find((p) => p.SC_ID === sc.SC_ID);
                        return (
                          <div
                            key={sc.SC_ID}
                            className="bg-white border border-[#e8e2d6] p-5 rounded-2xl flex items-start gap-4 shadow-xs"
                          >
                            <div className="bg-[#82937f]/10 p-3 rounded-xl border border-[#82937f]/20 text-[#5a634a] shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-serif font-bold text-[#343430]">{sc.Mech_Name}</h4>
                              <div className="pt-2 text-[11px] text-[#7a736a] space-y-1">
                                <span className="block font-medium">
                                  Location:{" "}
                                  <span className="text-[#4a4238] font-bold">
                                    {phoneInfo ? phoneInfo["SC Locate"] : "India Hub"}
                                  </span>
                                </span>
                                <span className="block font-mono">
                                  Hotline:{" "}
                                  <span className="text-[#5a634a] font-black text-xs">
                                    {phoneInfo ? phoneInfo["SC Phone"] : "022-4567890"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* SERVICE-RECORDS / ALL AUX TABLES CRUD (Admin/Salesperson/Service restricted) */}
                {currentUser.role !== "customer" && currentModule !== "dashboard" && currentModule !== "available_vehicles" && (
                  <motion.div
                    key={currentModule}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Module Custom Header with Adding capabilities */}
                    <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#e8e2d6] pb-4">
                      <div>
                        <h2 className="text-2xl font-serif font-black text-[#343430] tracking-tight uppercase">
                          📋 {getHumanFriendlyModuleName(currentModule)} database
                        </h2>
                        <p className="text-[#7a736a] text-xs mt-0.5">
                          Direct live editing and relational indexing of SQL records
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenAddModal(currentModule)}
                          className="bg-[#82937f] hover:bg-[#5a634a] text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <Plus className="w-4.5 h-4.5" />
                          <span>Insert new entry</span>
                        </button>
                      </div>
                    </div>

                    {/* Table View */}
                    {(() => {
                      const dataSource = (db as any)[currentModule] || [];
                      if (dataSource.length === 0) {
                        return (
                          <div className="text-center py-20 text-[#7a736a] border border-[#e8e2d6] bg-white rounded-3xl space-y-2 shadow-xs">
                            <Info className="w-10 h-10 text-[#82937f] mx-auto" />
                            <p className="text-sm font-bold text-[#343430]">This database table currently holds no records</p>
                            <p className="text-xs max-w-sm mx-auto">
                              Click the button above to seed a relational row inside the live database memory space.
                            </p>
                          </div>
                        );
                      }

                      // Dynamic headers based on keys, excluding redundant casing properties for clean spreadsheet view
                      const headers = (() => {
                        if (currentModule === "vehicles") {
                          return ["V_ID", "VIN", "REG_NO", "PRICE", "VEHICLE_TYPE", "YEAR_OF_MANUFACTURE", "MODEL", "M_ID"];
                        }
                        if (currentModule === "customers") {
                          return ["C_ID", "C_NAME", "CITY", "STATE", "PIN"];
                        }
                        if (currentModule === "customer_phone") {
                          return ["C_ID", "PH_NO"];
                        }
                        if (currentModule === "socials") {
                          return ["M_ID", "SOCIAL_MEDIA"];
                        }
                        if (currentModule === "vehicle_color") {
                          return ["V_ID", "COLOR"];
                        }
                        if (currentModule === "sales_id_records") {
                          return ["V_ID", "S_ID"];
                        }
                        if (currentModule === "sales_phone") {
                          return ["S_ID", "SP_PHONE"];
                        }
                        return Object.keys(dataSource[0]).filter((h) => {
                          if (["service_phone", "serviced_at", "service_centre"].includes(currentModule)) {
                            return !["Reg_NO", "Mech_ID", "Mech_Name", "Cost", "Date_of_Serv", "Description", "SC Phone", "SC Locate"].includes(h);
                          }
                          return true;
                        });
                      })();
                      const idField = headers[0];

                      return (
                        <div className="bg-white border border-[#e8e2d6] rounded-2xl overflow-hidden shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#f2f0e9] text-[#5a634a] uppercase font-mono text-[10px] tracking-wider border-b border-[#e8e2d6]">
                                  {headers.map((h) => (
                                    <th key={h} className="p-4">
                                      {h.replace(/_/g, " ")}
                                    </th>
                                  ))}
                                  <th className="p-4 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e8e2d6]">
                                {dataSource.map((row: any, rIdx: number) => (
                                  <tr key={rIdx} className="hover:bg-[#f7f5f0] transition-colors">
                                    {headers.map((colName) => (
                                      <td key={colName} className="p-4">
                                        {colName === "Price" || colName === "PRICE" || colName === "Cost" || colName === "COST" || colName === "S_Price" ? (
                                          <span className="font-mono text-[#5a634a] font-bold">
                                            ₹{row[colName]?.toLocaleString("en-IN")}
                                          </span>
                                        ) : typeof row[colName] === "object" ? (
                                          JSON.stringify(row[colName])
                                        ) : (
                                          <span className="text-[#343430] font-bold">{row[colName]}</span>
                                        )}
                                      </td>
                                    ))}
                                    <td className="p-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => handleOpenEditModal(currentModule, row, rIdx)}
                                          className="text-amber-600 hover:text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 p-2 rounded-lg border border-amber-200 transition-all cursor-pointer"
                                          title="Update Record"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRow(currentModule, idField, row[idField], rIdx)}
                                          className="text-red-600 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg border border-red-200 transition-all cursor-pointer"
                                          title="Delete Row"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e8e2d6] bg-[#f2f0e9] py-4 px-6 text-center text-[#7a736a] text-xs flex items-center justify-between flex-wrap gap-2">
        <p className="font-mono text-[10px]">
          &copy; 1995 - 2026 VMS India Operations Support &bull; Bengaluru Design Lab
        </p>
        <p className="text-[10px] bg-[#efede6] px-2 py-0.5 rounded border border-[#e5e0d5] text-[#4a4238]">
          Scanned with OKEN Scanner
        </p>
      </footer>

      {/* MASTER OPERATIONS DIALOG MODALS WITH VALIDATIONS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#4a4238]/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#e8e2d6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-serif font-black text-[#343430] uppercase">
                ➕ Add record to {getHumanFriendlyModuleName(addEntity)}
              </h3>
              <p className="text-[#7a736a] text-xs mt-0.5">
                Fill the required parameters accurately. Values will validate relational keys.
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {Object.keys(addFormValues).map((fieldName) => (
                  <div key={fieldName}>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                      {fieldName.replace(/_/g, " ")}
                    </label>
                    <input
                      required
                      value={addFormValues[fieldName]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddFormValues((prev) => ({
                          ...prev,
                          [fieldName]: val
                        }));
                      }}
                      placeholder={`e.g. ${
                        fieldName === "VIN"
                          ? "MA3YMB..."
                          : fieldName === "M_ID"
                          ? "1"
                          : fieldName === "Price"
                          ? "750000"
                          : "value"
                      }`}
                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e2d6]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white hover:bg-[#efede6] border border-[#e8e2d6] text-[#4a4238] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#82937f] hover:bg-[#5a634a] text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  Insert Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* UPDATE OPERATIONS DIALOG MODALS WITH VALIDATIONS */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#4a4238]/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#e8e2d6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-serif font-black text-[#343430] uppercase">
                ✏️ Update record in {getHumanFriendlyModuleName(editEntity)}
              </h3>
              <p className="text-[#7a736a] text-xs mt-0.5">
                Revise field parameters and apply adjustments to database rows.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {Object.keys(editFormValues).map((fieldName) => (
                  <div key={fieldName}>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                      {fieldName.replace(/_/g, " ")}
                    </label>
                    <input
                      required
                      value={editFormValues[fieldName]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditFormValues((prev) => ({
                          ...prev,
                          [fieldName]: val
                        }));
                      }}
                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e2d6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-white hover:bg-[#efede6] border border-[#e8e2d6] text-[#4a4238] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#82937f] hover:bg-[#5a634a] text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-[#4a4238]/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#e8e2d6] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-serif font-black uppercase text-[#343430]">
                Confirm Deletion
              </h3>
            </div>
            
            <p className="text-xs text-[#7a736a] leading-relaxed">
              Are you absolutely sure you want to delete this <span className="font-extrabold text-[#343430]">{getHumanFriendlyModuleName(deleteConfirmation.entityName)}</span> record?
            </p>

            {deleteConfirmation.idValue !== undefined && (
              <div className="bg-[#efede6] rounded-lg p-3 border border-[#e5e0d5] space-y-1">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-[#7a736a] font-bold">
                  Record Identifier ({deleteConfirmation.idField})
                </span>
                <span className="font-mono text-xs font-black text-[#343430]">
                  {String(deleteConfirmation.idValue)}
                </span>
              </div>
            )}

            <p className="text-[10px] text-red-600 font-mono leading-tight">
              * This operation is local and updates the operations registry memory.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="bg-white hover:bg-[#efede6] border border-[#e8e2d6] text-[#4a4238] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Delete Record
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADD CATALOG VEHICLE DYNAMIC MODAL */}
      {isAddCatalogVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-[#4a4238]/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#e8e2d6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-serif font-black text-[#343430] uppercase flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#82937f]" />
                <span>Add Vehicle to {selectedCatalogBrand} Catalog</span>
              </h3>
              <p className="text-[#7a736a] text-xs mt-0.5">
                Insert a brand new custom vehicle line with specification details and custom photo.
              </p>
            </div>

            <form onSubmit={handleAddCatalogVehicleSubmit} className="space-y-4">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                    Vehicle Model Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newCatModel}
                    onChange={(e) => setNewCatModel(e.target.value)}
                    placeholder="e.g. Fortuner GR Sport"
                    className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                    Vehicle Category / Type
                  </label>
                  <select
                    value={newCatCategory}
                    onChange={(e) => setNewCatCategory(e.target.value)}
                    className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                  >
                    <option value="Premium SUV">Premium SUV</option>
                    <option value="Super SUV">Super SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Coupe / Super Sports">Coupe / Super Sports</option>
                    <option value="Luxury MPV">Luxury MPV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Electric Cruiser">Electric Cruiser</option>
                    <option value="Cafe Racer Motorcycle">Cafe Racer Motorcycle</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                      Engine/Motor Specs
                    </label>
                    <input
                      type="text"
                      value={newCatEngine}
                      onChange={(e) => setNewCatEngine(e.target.value)}
                      placeholder="e.g. 3.0L twin-turbo V6, 306 HP"
                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                      Transmission System
                    </label>
                    <input
                      type="text"
                      value={newCatTransmission}
                      onChange={(e) => setNewCatTransmission(e.target.value)}
                      placeholder="e.g. 10-speed shiftmatic"
                      className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                    Price (ex-showroom India)
                  </label>
                  <input
                    type="text"
                    value={newCatPrice}
                    onChange={(e) => setNewCatPrice(e.target.value)}
                    placeholder="e.g. 45 Lakh onwards"
                    className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-lg py-2 px-3 text-xs text-[#343430] placeholder:text-[#9a9286] focus:outline-none focus:ring-1 focus:ring-[#82937f]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-1 font-bold">
                    Vehicle Photo (Upload custom image)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#e5e0d5] rounded-xl cursor-pointer hover:bg-[#efede6]/50 bg-[#efede6]/20 transition-all">
                    {newCatImage ? (
                      <div className="w-full h-full relative p-1">
                        <img src={newCatImage} className="w-full h-full object-cover rounded-lg animate-fade-in" alt="Preview" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewCatImage(null);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-[8px] font-extrabold hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="w-6 h-6 text-[#82937f] mb-1" />
                        <p className="text-[10px] text-[#7a736a] font-semibold">Click to upload photo</p>
                        <p className="text-[8px] text-[#9a9286] mt-0.5">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              setNewCatImage(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e2d6]">
                <button
                  type="button"
                  onClick={() => setIsAddCatalogVehicleOpen(false)}
                  className="bg-white hover:bg-[#efede6] border border-[#e8e2d6] text-[#4a4238] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#82937f] hover:bg-[#5a634a] text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  Add to Catalog
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CUSTOMER GUEST REGISTER MODAL (Garage ownership assignment) */}
      {isCustRegModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#4a4238]/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#e8e2d6] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-serif font-black text-[#343430]">📝 Register Vehicle (Ownership)</h3>
              <p className="text-[#7a736a] text-xs mt-0.5">
                Link system standard specifications to your Customer ID key
              </p>
            </div>

            <form onSubmit={handleCustomerRegisterVehicle} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7a736a] mb-2 font-bold">
                  Select available vehicle profile
                </label>
                <select
                  required
                  value={selectedRegVehicleId || ""}
                  onChange={(e) => setSelectedRegVehicleId(Number(e.target.value))}
                  className="w-full bg-[#efede6] border border-[#e5e0d5] rounded-xl py-2.5 px-3 text-xs text-[#343430] focus:outline-none focus:ring-1 focus:ring-[#82937f] cursor-pointer"
                >
                  <option value="">-- Choose Profile --</option>
                  {db.vehicles
                    .filter((v) => !db.owned_by.some((ow) => ow.C_ID === currentUser?.id && ow.V_ID === v.V_ID))
                    .map((veh) => (
                      <option key={veh.V_ID} value={veh.V_ID}>
                        {veh.Model} ({getManuName(veh.M_ID)}) - ₹{veh.Price.toLocaleString("en-IN")}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e8e2d6]">
                <button
                  type="button"
                  onClick={() => setIsCustRegModalOpen(false)}
                  className="bg-white hover:bg-[#efede6] border border-[#e8e2d6] text-[#4a4238] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-[#82937f] hover:bg-[#5a634a] text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  Link to My Garage
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
