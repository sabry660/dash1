import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BedDouble, Sparkles, Hammer, CheckCircle2, User, Filter, Layers, 
  Grid3X3, List, Search, ChevronLeft, Eye, Edit, 
  Calendar, MapPin, Users, Clock, X, Save, Building2, Image as ImageIcon, Star, Loader2, Plus, Trash2, Wifi, Tv, Check
} from 'lucide-react';
import { Room } from '../types';
import { apiService, RoomResponse } from '../services/api';
import { useThemeColors } from '../hooks/useThemeColors';
import { compressImage, isValidImageFile, CompressionProgress } from '../utils/imageCompression';
import { dataCache, cacheKeys } from '../services/dataCache';

// Helper functions for Arabic translations
const getBedTypeArabic = (bedType?: string): string => {
  const translations: Record<string, string> = {
    'TWIN': 'سريرين منفصلين',
    'DOUBLE': 'سرير مزدوج',
    'QUEEN': 'سرير كوين',
    'KING': 'سرير كينج',
  };
  return translations[bedType || ''] || bedType || 'غير متاح';
};

const getViewTypeArabic = (viewType?: string): string => {
  const translations: Record<string, string> = {
    'CITY': 'مدينة',
    'PANORAMIC': 'بانوراما',
    'SEA': 'بحر',
    'GARDEN': 'حديقة',
    'MOUNTAIN': 'جبل',
    'POOL': 'مسبح',
    'RIVER': 'نهر',
    'LANDMARK': 'معلم سياحي',
  };
  return translations[viewType || ''] || viewType || 'غير متاح';
};

const getRoomTypeArabic = (roomType?: string): string => {
  const translations: Record<string, string> = {
    'SINGLE': 'غرفة فردية',
    'DOUBLE': 'غرفة مزدوجة',
    'SUITE': 'جناح',
  };
  return translations[roomType || ''] || roomType || 'غير متاح';
};

interface RoomsSectionProps {
  rooms?: Room[];
  onUpdateRoomStatus?: (roomId: string, status: Room['status']) => void;
  onUpdateRoom?: (updatedRoom: Room) => void;
}

export default function RoomsSection({ rooms: initialRooms = [], onUpdateRoomStatus, onUpdateRoom }: RoomsSectionProps) {
  const { colors, isDark } = useThemeColors();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Room['status']>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'price' | 'floor' | 'status'>('number');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [activeSection, setActiveSection] = useState<'rooms' | 'categories'>('rooms');
  
  // Create Room Modal State
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    categoryId: 0,
    viewType: 'CITY' as 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK',
    floor: 2,
  });
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);
  const [roomImageFile, setRoomImageFile] = useState<File | null>(null);
  const [roomImagePreview, setRoomImagePreview] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [roomCategories, setRoomCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [editCategoryError, setEditCategoryError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryData, setEditCategoryData] = useState({
    name: '',
    description: '',
    price: 0,
    numBeds: 1,
    bedType: 'DOUBLE' as 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING',
    maxAdults: 2,
    maxKids: 0,
    hasWifi: true,
    numTvs: 1,
  });
  const [editCategoryImageFile, setEditCategoryImageFile] = useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState<string | null>(null);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [ratesCategory, setRatesCategory] = useState<any>(null);
  const [ratesFromDate, setRatesFromDate] = useState('');
  const [ratesToDate, setRatesToDate] = useState('');
  const [ratesPrice, setRatesPrice] = useState(0);
  const [isSettingRates, setIsSettingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [categoryRates, setCategoryRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    price: 0,
    numBeds: 1,
    bedType: 'DOUBLE' as 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING',
    maxAdults: 2,
    maxKids: 0,
    hasWifi: true,
    numTvs: 1,
  });

  // Edit Room Modal State
  const [editRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [editRoomData, setEditRoomData] = useState({
    roomNumber: '',
    maxAdults: 2,
    maxKids: 0,
    description: '',
    floor: 2,
    price: 0,
    roomType: 'SINGLE' as 'SINGLE' | 'DOUBLE' | 'SUITE',
    hasWifi: true,
    numTvs: 1,
    viewType: 'CITY' as 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK',
    numBeds: 1,
    bedType: 'DOUBLE' as 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING',
    status: 'AVAILABLE' as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE',
    categoryId: 0,
  });
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [updateRoomError, setUpdateRoomError] = useState<string | null>(null);
  const [editRoomImageFile, setEditRoomImageFile] = useState<File | null>(null);
  const [editRoomImagePreview, setEditRoomImagePreview] = useState<string | null>(null);

  const floors = [2, 3, 4, 5];

  useEffect(() => {
    // Load rooms and categories in parallel
    loadRooms();
    loadRoomCategories();
  }, [filter, selectedFloor]);

  // 15-second polling for rooms and categories
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      loadRooms();
      loadRoomCategories();
    }, 15000); // Poll every 15 seconds
    return () => clearInterval(pollingInterval);
  }, [filter, selectedFloor]);

  const loadRoomCategories = async () => {
    const cacheKey = cacheKeys.rooms.roomCategories();
    
    // Check if request is already pending
    if (dataCache.isPending(cacheKey)) {
      return;
    }

    // Check cache first
    const cachedData = dataCache.get<any[]>(cacheKey);
    if (cachedData && cachedData.length > 0) {
      setRoomCategories(cachedData);
      setIsCategoriesLoading(false);
      return;
    }

    setIsCategoriesLoading(true);
    setCategoriesError(null);
    
    // Make API request
    const requestPromise = (async () => {
      try {
        const response = await apiService.getRoomCategories();
        const categories = response.content || response || [];
        
        // Only cache successful responses
        if (categories.length > 0) {
          dataCache.set(cacheKey, categories);
        }
        
        setRoomCategories(categories);
      } catch (error) {
        setCategoriesError('فشل تحميل فئات الغرف');
        console.error('Failed to load room categories:', error);
        // Keep existing cached data if available
        const existingCache = dataCache.get<any[]>(cacheKey);
        if (existingCache) {
          setRoomCategories(existingCache);
        }
      } finally {
        setIsCategoriesLoading(false);
      }
    })();

    dataCache.setPending(cacheKey, requestPromise);
    await requestPromise;
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.price) {
      setCreateCategoryError('يرجى تعبئة الاسم والسعر');
      return;
    }

    setIsCreatingCategory(true);
    setCreateCategoryError(null);
    try {
      await apiService.createRoomCategory(newCategory);
      setIsCreateCategoryModalOpen(false);
      setNewCategory({
        name: '',
        description: '',
        price: 0,
        numBeds: 1,
        bedType: 'DOUBLE',
        maxAdults: 2,
        maxKids: 0,
        hasWifi: true,
        numTvs: 1,
      });
      loadRoomCategories();
    } catch (e) {
      setCreateCategoryError('فشل إنشاء فئة الغرفة');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditCategoryData({
      name: category.name,
      description: category.description || '',
      price: category.price,
      numBeds: category.numBeds,
      bedType: category.bedType,
      maxAdults: category.maxAdults,
      maxKids: category.maxKids,
      hasWifi: category.hasWifi,
      numTvs: category.numTvs,
    });
    setEditCategoryImagePreview(category.imageUrl || null);
    setIsEditCategoryModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryData.name || editCategoryData.price <= 0) {
      setEditCategoryError('يرجى تعبئة الاسم والسعر');
      return;
    }

    setIsUpdatingCategory(true);
    setEditCategoryError(null);
    try {
      await apiService.updateRoomCategory(editingCategory.id, editCategoryData);

      // Upload image if provided
      if (editCategoryImageFile) {
        try {
          const compressedFile = await compressImage(editCategoryImageFile, {}, () => {});
          await apiService.uploadRoomCategoryImage(editingCategory.id, compressedFile);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
        }
      }

      setIsEditCategoryModalOpen(false);
      setEditCategoryImageFile(null);
      setEditCategoryImagePreview(null);
      loadRoomCategories();
    } catch (e) {
      setEditCategoryError('فشل تحديث فئة الغرفة');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;

    try {
      await apiService.deleteRoomCategory(categoryId);
      loadRoomCategories();
    } catch (e) {
      alert('فشل حذف فئة الغرفة');
    }
  };

  const handleOpenRatesModal = (category: any) => {
    setRatesCategory(category);
    setRatesFromDate('');
    setRatesToDate('');
    setRatesPrice(category.price);
    setRatesError(null);
    setCategoryRates([]);
    setIsRatesModalOpen(true);
  };

  const handleLoadRates = async () => {
    if (!ratesFromDate || !ratesToDate) {
      setRatesError('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setIsLoadingRates(true);
    setRatesError(null);
    try {
      const rates = await apiService.getRoomCategoryRates(ratesCategory.id, ratesFromDate, ratesToDate);
      setCategoryRates(rates);
    } catch (e) {
      setRatesError('فشل تحميل الأسعار');
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleSetRates = async () => {
    if (!ratesFromDate || !ratesToDate || ratesPrice <= 0) {
      setRatesError('يرجى تعبئة جميع الحقول');
      return;
    }

    setIsSettingRates(true);
    setRatesError(null);
    try {
      await apiService.setRoomCategoryRates(ratesCategory.id, {
        startDate: ratesFromDate,
        endDate: ratesToDate,
        price: Number(ratesPrice),
      });
      handleLoadRates();
    } catch (e) {
      setRatesError('فشل تعيين الأسعار');
    } finally {
      setIsSettingRates(false);
    }
  };

  const loadRooms = async () => {
    const cacheKey = cacheKeys.rooms.rooms(filter, selectedFloor);
    
    // Check if request is already pending
    if (dataCache.isPending(cacheKey)) {
      return;
    }

    // Check cache first - use cached data regardless of age
    const cachedData = dataCache.get<Room[]>(cacheKey);
    if (cachedData && cachedData.length > 0) {
      setRooms(cachedData);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Make API request
    const requestPromise = (async () => {
      try {
        const statusParam = filter === 'all' ? undefined : filter.toUpperCase() as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
        const response = await apiService.getRooms(
          statusParam,
          selectedFloor === 'all' ? undefined : selectedFloor,
          0,
          50
        );
        
        // Transform backend response to Room format
        const transformedRooms = (response.content || []).map((room: RoomResponse) => ({
          id: room.id.toString(),
          number: room.roomNumber,
          status: room.status.toLowerCase() as Room['status'],
          floor: room.floor,
          pricePerNight: room.price,
          type: room.categoryName || 'Standard',
          name: `Room ${room.roomNumber}`,
          maxAdults: room.maxAdults,
          maxKids: room.maxKids,
          categoryId: room.categoryId ?? 0,
          image: room.imageUrl || '',
          hasWifi: room.hasWifi,
          numTvs: room.numTvs,
          viewType: room.viewType,
          numBeds: room.numBeds,
          bedType: room.bedType,
          description: room.description || '',
          amenities: [
            room.hasWifi ? 'Wi-Fi' : null,
            room.numTvs > 0 ? `TV (${room.numTvs})` : null,
            room.bedType ? `${room.bedType} Bed` : null,
          ].filter(Boolean) as string[],
        }));
        
        // Only cache successful HTTP 200 responses
        if (transformedRooms.length > 0) {
          dataCache.set(cacheKey, transformedRooms);
        }
        
        setRooms(transformedRooms);
      } catch (error: any) {
        // Keep existing cached data if available (don't overwrite with error)
        const existingCache = dataCache.get<Room[]>(cacheKey);
        if (existingCache) {
          setRooms(existingCache);
        } else {
          setError('فشل تحميل الغرف');
          console.error('Failed to load rooms:', error);
          setRooms([]);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    dataCache.setPending(cacheKey, requestPromise);
    await requestPromise;
  };

  const handleCreateRoom = async () => {
    if (!newRoom.roomNumber || newRoom.categoryId === 0) {
      setCreateRoomError('يرجى إدخال رقم الغرفة وفئة الغرفة');
      return;
    }

    setIsCreatingRoom(true);
    setCreateRoomError(null);
    try {
      const createdRoom = await apiService.createRoom({
        roomNumber: newRoom.roomNumber,
        categoryId: newRoom.categoryId,
        floor: newRoom.floor,
        viewType: newRoom.viewType,
      });

      // Upload image if provided
      if (roomImageFile) {
        setIsCompressingImage(true);
        setCompressionProgress({ progress: 0, isCompressing: true, isUploading: false });
        
        try {
          const compressedFile = await compressImage(roomImageFile, {}, (progress) => {
            setCompressionProgress(progress);
          });
          
          setCompressionProgress({ progress: 0, isCompressing: false, isUploading: true });
          await apiService.uploadRoomImage(createdRoom.id, compressedFile);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue even if image upload fails
        } finally {
          setIsCompressingImage(false);
          setCompressionProgress(null);
        }
      }
      
      // Reset form and close modal
      setNewRoom({
        roomNumber: '',
        categoryId: 0,
        viewType: 'CITY',
        floor: 2,
      });
      setRoomImageFile(null);
      setRoomImagePreview(null);
      setCreateRoomModalOpen(false);
      
      // Reload rooms
      loadRooms();
    } catch (error: any) {
      setCreateRoomError('فشل إنشاء الغرفة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setCreateRoomError('يرجى اختيار صورة بصيغة JPG, PNG أو WebP');
      return;
    }

    setRoomImageFile(file);
    setRoomImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setRoomImageFile(null);
    setRoomImagePreview(null);
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !editRoomData.roomNumber || !editRoomData.categoryId || editRoomData.price <= 0) {
      setUpdateRoomError('يرجى إدخال رقم الغرفة والسعر والفئة');
      return;
    }

    setIsUpdatingRoom(true);
    setUpdateRoomError(null);
    try {
      const roomId = Number(editingRoom.id);
      const categoryId = Number(editRoomData.categoryId ?? editingRoom.categoryId ?? 0);

      await apiService.updateRoom(roomId, {
        roomNumber: editRoomData.roomNumber,
        categoryId,
        floor: editRoomData.floor,
        viewType: editRoomData.viewType,
        description: editRoomData.description,
        status: editRoomData.status,
      });

      // Upload image if provided
      if (editRoomImageFile) {
        try {
          setIsCompressingImage(true);
          setCompressionProgress({ progress: 0, isCompressing: true, isUploading: false });
          
          const compressedFile = await compressImage(editRoomImageFile, {}, (progress) => {
            setCompressionProgress(progress);
          });
          
          setCompressionProgress({ progress: 0, isCompressing: false, isUploading: true });
          await apiService.uploadRoomImage(roomId, compressedFile);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          // Don't alert - just log and continue
          // The room data was updated successfully, just image failed
        } finally {
          setIsCompressingImage(false);
          setCompressionProgress(null);
        }
      }
      
      // Reset form and close modal
      setEditRoomData({
        roomNumber: '',
        maxAdults: 2,
        maxKids: 0,
        description: '',
        floor: 2,
        price: 0,
        roomType: 'SINGLE',
        hasWifi: true,
        numTvs: 1,
        viewType: 'CITY',
        numBeds: 1,
        bedType: 'DOUBLE',
        status: 'AVAILABLE',
        categoryId: 0,
      });
      setEditRoomImageFile(null);
      setEditRoomImagePreview(null);
      setEditRoomModalOpen(false);
      setEditingRoom(null);
      
      // Reload rooms
      loadRooms();
    } catch (error: any) {
      setUpdateRoomError('فشل تحديث الغرفة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setUpdateRoomError('يرجى اختيار صورة بصيغة JPG, PNG أو WebP');
      return;
    }

    setEditRoomImageFile(file);
    setEditRoomImagePreview(URL.createObjectURL(file));
  };

  const handleEditRemoveImage = () => {
    setEditRoomImageFile(null);
    setEditRoomImagePreview(null);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesFilter = filter === 'all' || room.status === filter;
    const matchesFloor = selectedFloor === 'all' || room.floor === selectedFloor;
    const matchesSearch = searchQuery === '' || 
      room.number.includes(searchQuery) || 
      room.name.includes(searchQuery) ||
      room.type.includes(searchQuery);
    return matchesFilter && matchesFloor && matchesSearch;
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch (sortBy) {
      case 'number': return b.number.localeCompare(a.number);
      case 'price': return b.pricePerNight - a.pricePerNight;
      case 'floor': return b.floor - a.floor;
      case 'status': return a.status.localeCompare(b.status);
      default: return 0;
    }
  });

  const paginatedRooms = sortedRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedRooms.length / itemsPerPage);

  const getStatusLabel = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'متاحة';
      case 'occupied': return 'مشغولة';
      case 'cleaning': return 'جاري التنظيف';
      case 'maintenance': return 'صيانة';
    }
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'occupied': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cleaning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusDot = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'occupied': return 'bg-amber-500';
      case 'cleaning': return 'bg-amber-500';
      case 'maintenance': return 'bg-amber-500';
    }
  };

  const getStatusIcon = (status: Room['status']) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'occupied': return <User className="w-3.5 h-3.5" />;
      case 'cleaning': return <Sparkles className="w-3.5 h-3.5" />;
      case 'maintenance': return <Hammer className="w-3.5 h-3.5" />;
    }
  };

  const handleUpdateRoomStatus = async (roomId: string, status: Room['status']) => {
    try {
      const backendStatus = status.toUpperCase() as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
      await apiService.patchRoom(parseInt(roomId), { status: backendStatus });
      // Instant local update
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(prev => prev ? { ...prev, status } : null);
        // Close the edit modal immediately after status change
        setSelectedRoom(null);
      }
    } catch (error) {
      // Reload from backend on error to sync state
      loadRooms();
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await apiService.deleteRoom(parseInt(roomId));
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(null);
      }
    } catch (error) {
      loadRooms();
    }
  };

  const handleBulkAction = (action: string) => {
    selectedRooms.forEach(roomId => {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        if (action === 'available') {
          handleUpdateRoomStatus(roomId, 'available');
        } else if (action === 'maintenance') {
          handleUpdateRoomStatus(roomId, 'maintenance');
        }
      }
    });
    setSelectedRooms(new Set());
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#AA7B30]">إدارة وتتبع وحدات الفندق</h1>
          <p className="text-gray-500 text-xs mt-1">تتبع حالة كافة الغرف والأجنحة الفاخرة، والتحكم في مهام الصيانة والتنظيف المباشر.</p>
        </div>
        
        {/* Section Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSection('rooms')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeSection === 'rooms' ? 'bg-white text-[#AA7B30]' : 'text-gray-500'
            }`}
          >
            الغرف
          </button>
          <button
            onClick={() => setActiveSection('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeSection === 'categories' ? 'bg-white text-[#AA7B30]' : 'text-gray-500'
            }`}
          >
            فئات الغرف
          </button>
        </div>
      </div>

      {/* Add Room Button - Only show in rooms section */}
      {activeSection === 'rooms' && (
        <button
          onClick={() => setCreateRoomModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
        >
          <Plus size={16} />
          <span>إضافة غرفة</span>
        </button>
      )}

      {/* Add Category Button - Only show in categories section */}
      {activeSection === 'categories' && (
        <button
          onClick={() => setIsCreateCategoryModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
        >
          <Plus size={16} />
          <span>إضافة فئة</span>
        </button>
      )}

      {/* Floor Selector - Only show in rooms section */}
      {activeSection === 'rooms' && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-gray-400 whitespace-nowrap">اختر الطابق:</span>
          <button
            onClick={() => setSelectedFloor('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap border ${
              selectedFloor === 'all'
                ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            جميع الطوابق
          </button>
          {floors.map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap border ${
                selectedFloor === floor
                  ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              الطابق {floor}
            </button>
          ))}
        </div>
      )}

      {/* Filters & Actions Bar - Only show in rooms section */}
      {activeSection === 'rooms' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="بحث عن غرفة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-9 pl-3 py-2 text-xs text-gray-800 placeholder-gray-500 focus:outline-none w-48"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <Filter className="text-[#D4AF37] w-4 h-4" />
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 border ${
                  filter === 'all' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                الكل
              </button>
              {(['available', 'occupied', 'cleaning', 'maintenance'] as Room['status'][]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 flex items-center gap-1.5 border ${
                    filter === status ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {getStatusIcon(status)}
                  <span>{getStatusLabel(status)}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D4AF37] ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              <option value="number">ترتيب: الرقم</option>
              <option value="price">ترتيب: السعر</option>
              <option value="floor">ترتيب: الطابق</option>
              <option value="status">ترتيب: الحالة</option>
            </select>

            <div className="flex items-center gap-2">
              {/* Bulk Actions */}
              {selectedRooms.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: colors.text.muted }}>{selectedRooms.size} محدد</span>
                  <button
                    onClick={() => handleBulkAction('available')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                  >
                    تعيين متاح
                  </button>
                  <button
                    onClick={() => handleBulkAction('maintenance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-red-950/40 text-red-400 border-red-500/20 hover:bg-red-950/60' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                  >
                    صيانة
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Room Cards - Grid View - Only show in rooms section */}
      {activeSection === 'rooms' && viewMode === 'grid' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
            </div>
          ) : error ? (
            <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
              <X size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-sm font-bold mb-2" style={{ color: colors.text.muted }}>فشل تحميل الغرف</h3>
              <p className="text-xs mb-4" style={{ color: colors.text.disabled }}>{error}</p>
              <button
                onClick={loadRooms}
                className="px-4 py-2 text-black font-extrabold text-xs rounded-xl"
                style={{ background: colors.primary.goldGradient }}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : paginatedRooms.length === 0 ? (
            <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
              <BedDouble size={48} className="mx-auto mb-4" style={{ color: colors.text.muted }} />
              <h3 className="text-sm font-bold mb-2" style={{ color: colors.text.muted }}>لا توجد غرف</h3>
              <p className="text-xs mb-4" style={{ color: colors.text.disabled }}>لم يتم العثور على غرف تطابق البحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {paginatedRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="relative backdrop-blur-xl border rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] transition-all duration-500 hover:-translate-y-2 group bg-white border-gray-200">
                {/* Room Image */}
                <div className="relative h-64 overflow-hidden">
                  {room.image ? (
                    <img 
                      src={room.image} 
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { 
                        e.currentTarget.src = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600";
                      }}
                    />
                  ) : (
                    <img 
                      src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600" 
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg ${getStatusColor(room.status)}`}>
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(room.status)}`}></span>
                      <span>{getStatusLabel(room.status)}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <span className="text-4xl font-black font-mono text-white drop-shadow-lg">{room.number}</span>
                    <span className="text-sm text-white/80 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg font-bold">{getRoomTypeArabic(room.type)}</span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-6">
                  {/* Room Number & Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#AA7B30]">{room.number}</h3>
                      <p className="text-sm text-gray-500">{room.categoryName || 'غير محدد'}</p>
                    </div>
                  </div>

                  {/* Details - Side by Side */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Floor */}
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <Building2 size={16} className="text-gray-400" />
                      <div>
                        <span className="block text-gray-400 text-xs">الطابق</span>
                        <span className="font-bold text-gray-800">{room.floor}</span>
                      </div>
                    </div>

                    {/* View Type */}
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <span className="block text-gray-400 text-xs">الإطلالة</span>
                        <span className="font-bold text-gray-800">{getViewTypeArabic(room.viewType)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {room.description && (
                    <div className="bg-gray-50 p-3 rounded-xl mb-4">
                      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{room.description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30 hover:bg-amber-50 transition-all duration-300"
                    >
                      <Eye size={16} />
                      <span>التفاصيل</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setEditRoomData({
                          roomNumber: room.number,
                          maxAdults: room.maxAdults || 2,
                          maxKids: room.maxKids || 0,
                          description: room.description || '',
                          floor: room.floor,
                          price: room.pricePerNight || 0,
                          roomType: (room.type === 'Standard' ? 'SINGLE' : room.type === 'Deluxe' ? 'DOUBLE' : 'SUITE') as 'SINGLE' | 'DOUBLE' | 'SUITE',
                          hasWifi: room.hasWifi || true,
                          numTvs: room.numTvs || 1,
                          viewType: room.viewType || 'CITY' as 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK',
                          numBeds: room.numBeds || 1,
                          bedType: room.bedType || 'DOUBLE' as 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING',
                          status: room.status.toUpperCase() as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE',
                          categoryId: Number(room.categoryId ?? 0),
                        });
                        setEditRoomImagePreview(room.image || null);
                        setEditRoomModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30 hover:bg-amber-50 transition-all duration-300"
                    >
                      <Edit size={16} />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
            </div>
          )}
        </>
      )}

      {/* Room Cards - List View - Only show in rooms section */}
      {activeSection === 'rooms' && viewMode === 'list' && (
        <div className="space-y-4">
          {paginatedRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative backdrop-blur-xl border rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] transition-all duration-300 ${isDark ? 'bg-white/80 border-gray-200' : 'bg-white/80 border-gray-200'}`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Room Image */}
                <div className="relative h-48 sm:h-auto sm:w-64 overflow-hidden">
                  <img 
                    src={room.images && room.images[0] ? room.images[0] : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'} 
                    alt={room.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800';
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#0b0b0b]' : 'from-gray-900/60'} via-transparent to-transparent sm:bg-gradient-to-l`} />
                  
                  <div className="absolute top-3 right-3 sm:top-3 sm:right-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border backdrop-blur-md ${getStatusColor(room.status)}`}>
                      {getStatusIcon(room.status)}
                      <span>{getStatusLabel(room.status)}</span>
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="flex-1 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black" style={{ color: colors.text.primary }}>{room.name}</h3>
                        <span className="px-2 py-1 rounded text-xs font-bold border" style={{ background: `${colors.primary.gold}10`, borderColor: `${colors.primary.gold}30`, color: colors.primary.gold }}>
                          {room.number}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: colors.text.muted }}>{room.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono" style={{ color: colors.primary.goldLight }}>
                        {room.pricePerNight.toLocaleString('ar-SA')}
                      </span>
                      <span className="text-xs block" style={{ color: colors.text.muted }}>ريال / ليلة</span>
                    </div>
                  </div>

                  <p className="text-xs line-clamp-2" style={{ color: colors.text.secondary }}>{room.description}</p>

                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                      <MapPin size={14} style={{ color: colors.primary.gold }} />
                      <span>الطابق {room.floor}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                      <Users size={14} style={{ color: colors.primary.gold }} />
                      <span>{room.maxAdults + (room.maxKids || 0)} نزلاء</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                      <BedDouble size={14} style={{ color: colors.primary.gold }} />
                      <span>{room.bedType || '-'} ({room.numBeds || 0})</span>
                    </div>
                    {room.hasWifi && (
                      <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                        <Wifi size={14} style={{ color: colors.primary.gold }} />
                        <span>Wi-Fi</span>
                      </div>
                    )}
                    {(room.numTvs || 0) > 0 && (
                      <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                        <Tv size={14} style={{ color: colors.primary.gold }} />
                        <span>TV ({room.numTvs})</span>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2">
                    {room.amenities?.filter(a => a).slice(0, 4).map((amenity, idx) => (
                      <span key={`${room.id}-amenity-${idx}`} className={`px-2 py-1 border rounded-md text-xs ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                        {amenity}
                      </span>
                    ))}
                    {(room.amenities?.length || 0) > 4 && (
                      <span className={`px-2 py-1 border rounded-md text-xs ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                        +{(room.amenities?.length || 0) - 4}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`flex gap-2 pt-3 border-t ${isDark ? 'border-gray-200/60' : 'border-gray-200'}`}>
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-800 hover:border-[#D4AF37]/30' : 'bg-gray-50 border-gray-300 text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30'}`}
                    >
                      <Eye size={14} />
                      <span>التفاصيل</span>
                    </button>
                    <button
                      onClick={() => handleUpdateRoomStatus(room.id, 'available')}
                      className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition ${isDark ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/60' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      <Calendar size={14} />
                      <span>حجز</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition ${isDark ? 'bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-950/60' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}
                    >
                      <Trash2 size={14} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:text-gray-900'}`}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg text-xs font-bold transition ${
                currentPage === page 
                  ? 'bg-[#D4AF37] text-black' 
                  : (isDark ? 'bg-gray-50 text-gray-400 border border-gray-200 hover:text-gray-800' : 'bg-gray-50 text-gray-600 border-gray-300 hover:text-gray-900')
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:text-gray-900'}`}
          >
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        </div>
      )}

      {/* Categories Section */}
      {activeSection === 'categories' && (
        <div className="space-y-6">
          {isCategoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
            </div>
          ) : categoriesError ? (
            <div className="text-center py-16 border rounded-2xl bg-white border-gray-200">
              <X size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-sm font-bold mb-2 text-gray-500">فشل تحميل فئات الغرف</h3>
              <p className="text-xs mb-4 text-gray-400">{categoriesError}</p>
              <button
                onClick={loadRoomCategories}
                className="px-4 py-2 text-black font-extrabold text-xs rounded-xl bg-gradient-to-r from-[#AA7B30] to-[#D4AF37]"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : roomCategories.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-white border-gray-200">
              <Layers size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-bold mb-2 text-gray-500">لا توجد فئات غرف</h3>
              <p className="text-xs mb-4 text-gray-400">ابدأ بإضافة فئة غرفة جديدة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomCategories.map((category: any) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] transition-all duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600";
                        }}
                      />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600"
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg bg-[#D4AF37]/20 text-[#AA7B30] border-[#D4AF37]/30">
                        <Star size={12} className="fill-[#D4AF37]" /> فئة
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className="text-4xl font-black font-mono text-white drop-shadow-lg">{category.name}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">السعر لليلة</span>
                      <span className="text-2xl font-black text-[#AA7B30]">{category.price ? `${category.price.toLocaleString('ar-SA')} ر.س` : 'غير متاح'}</span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                        <Users size={16} className="text-gray-400" />
                        <div>
                          <span className="block text-gray-400 text-xs">بالغين</span>
                          <span className="font-bold text-gray-800">{category.maxAdults || 'غير متاح'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                        <Users size={16} className="text-gray-400" />
                        <div>
                          <span className="block text-gray-400 text-xs">أطفال</span>
                          <span className="font-bold text-gray-800">{category.maxKids || 'غير متاح'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                        <BedDouble size={16} className="text-gray-400" />
                        <div>
                          <span className="block text-gray-400 text-xs">نوع السرير</span>
                          <span className="font-bold text-gray-800">{getBedTypeArabic(category.bedType)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                        <span className="text-gray-400">عدد الأسرة:</span>
                        <span className="font-bold text-gray-800">{category.numBeds || 'غير متاح'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                        <Tv size={16} className="text-gray-400" />
                        <div>
                          <span className="block text-gray-400 text-xs">تلفزيونات</span>
                          <span className="font-bold text-gray-800">{category.numTvs || 'غير متاح'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                        <Wifi size={16} className={category.hasWifi ? "text-green-500" : "text-gray-400"} />
                        <div>
                          <span className="block text-gray-400 text-xs">واي فاي</span>
                          <span className="font-bold text-gray-800">{category.hasWifi ? 'متاح' : 'غير متاح'}</span>
                        </div>
                      </div>
                    </div>

                    {category.description && (
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <span className="block text-gray-400 text-xs mb-1">الوصف</span>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{category.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30 hover:bg-amber-50 transition-all duration-300"
                      >
                        <Edit size={16} />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleOpenRatesModal(category)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30 hover:bg-amber-50 transition-all duration-300"
                      >
                        <Calendar size={16} />
                        <span>الأسعار</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Category Modal */}
      {isCreateCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full relative space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#AA7B30]">إضافة فئة غرفة جديدة</h3>
              <button onClick={() => setIsCreateCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {createCategoryError && (
              <div className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {createCategoryError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">اسم الفئة *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  placeholder="مثال: جناح ملكي"
                  disabled={isCreatingCategory}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">الوصف</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                  placeholder="وصف الفئة..."
                  rows={3}
                  disabled={isCreatingCategory}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">السعر لليلة *</label>
                <input
                  type="number"
                  value={newCategory.price}
                  onChange={(e) => setNewCategory({ ...newCategory, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  placeholder="مثال: 500"
                  min="0"
                  step="0.01"
                  disabled={isCreatingCategory}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد بالغين</label>
                  <input
                    type="number"
                    value={newCategory.maxAdults}
                    onChange={(e) => setNewCategory({ ...newCategory, maxAdults: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="1"
                    disabled={isCreatingCategory}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد أطفال</label>
                  <input
                    type="number"
                    value={newCategory.maxKids}
                    onChange={(e) => setNewCategory({ ...newCategory, maxKids: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="0"
                    disabled={isCreatingCategory}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد الأسرة</label>
                  <input
                    type="number"
                    value={newCategory.numBeds}
                    onChange={(e) => setNewCategory({ ...newCategory, numBeds: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="1"
                    disabled={isCreatingCategory}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">نوع السرير</label>
                  <select
                    value={newCategory.bedType}
                    onChange={(e) => setNewCategory({ ...newCategory, bedType: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isCreatingCategory}
                  >
                    <option value="TWIN">سريرين منفصلين</option>
                    <option value="DOUBLE">سرير مزدوج</option>
                    <option value="QUEEN">سرير كوين</option>
                    <option value="KING">سرير كينج</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد التلفزيونات</label>
                  <input
                    type="number"
                    value={newCategory.numTvs}
                    onChange={(e) => setNewCategory({ ...newCategory, numTvs: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="0"
                    disabled={isCreatingCategory}
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                  <Wifi size={16} className={newCategory.hasWifi ? "text-green-500" : "text-gray-400"} />
                  <div>
                    <span className="block text-gray-400 text-xs">واي فاي</span>
                    <span className="font-bold text-gray-800">{newCategory.hasWifi ? 'متاح' : 'غير متاح'}</span>
                  </div>
                  <button
                    onClick={() => setNewCategory({ ...newCategory, hasWifi: !newCategory.hasWifi })}
                    className="ml-auto text-[#D4AF37] hover:text-[#AA7B30]"
                  >
                    {newCategory.hasWifi ? <Check size={16} /> : <X size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsCreateCategoryModalOpen(false)}
                className="w-1/3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                disabled={isCreatingCategory}
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCategory}
                className="w-2/3 py-3 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl"
                disabled={isCreatingCategory}
              >
                {isCreatingCategory ? 'جاري الإنشاء...' : 'إنشاء الفئة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full relative space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#AA7B30]">تعديل فئة الغرفة</h3>
              <button onClick={() => setIsEditCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {editCategoryError && (
              <div className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {editCategoryError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">اسم الفئة *</label>
                <input
                  type="text"
                  value={editCategoryData.name}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  disabled={isUpdatingCategory}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">الوصف</label>
                <textarea
                  value={editCategoryData.description}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                  rows={3}
                  disabled={isUpdatingCategory}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">السعر لليلة *</label>
                <input
                  type="number"
                  value={editCategoryData.price}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  min="0"
                  step="0.01"
                  disabled={isUpdatingCategory}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد بالغين</label>
                  <input
                    type="number"
                    value={editCategoryData.maxAdults}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, maxAdults: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="1"
                    disabled={isUpdatingCategory}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد أطفال</label>
                  <input
                    type="number"
                    value={editCategoryData.maxKids}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, maxKids: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="0"
                    disabled={isUpdatingCategory}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد الأسرة</label>
                  <input
                    type="number"
                    value={editCategoryData.numBeds}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, numBeds: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="1"
                    disabled={isUpdatingCategory}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">نوع السرير</label>
                  <select
                    value={editCategoryData.bedType}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, bedType: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isUpdatingCategory}
                  >
                    <option value="TWIN">سريرين منفصلين</option>
                    <option value="DOUBLE">سرير مزدوج</option>
                    <option value="QUEEN">سرير كوين</option>
                    <option value="KING">سرير كينج</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد التلفزيونات</label>
                  <input
                    type="number"
                    value={editCategoryData.numTvs}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, numTvs: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="0"
                    disabled={isUpdatingCategory}
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                  <Wifi size={16} className={editCategoryData.hasWifi ? "text-green-500" : "text-gray-400"} />
                  <div>
                    <span className="block text-gray-400 text-xs">واي فاي</span>
                    <span className="font-bold text-gray-800">{editCategoryData.hasWifi ? 'متاح' : 'غير متاح'}</span>
                  </div>
                  <button
                    onClick={() => setEditCategoryData({ ...editCategoryData, hasWifi: !editCategoryData.hasWifi })}
                    className="ml-auto text-[#D4AF37] hover:text-[#AA7B30]"
                  >
                    {editCategoryData.hasWifi ? <Check size={16} /> : <X size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">صورة الفئة</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && isValidImageFile(file)) {
                      setEditCategoryImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setEditCategoryImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  disabled={isUpdatingCategory}
                />
                {editCategoryImagePreview && (
                  <img src={editCategoryImagePreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditCategoryModalOpen(false)}
                className="w-1/3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                disabled={isUpdatingCategory}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateCategory}
                className="w-2/3 py-3 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl"
                disabled={isUpdatingCategory}
              >
                {isUpdatingCategory ? 'جاري التحديث...' : 'تحديث الفئة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rates Modal */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full relative space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#AA7B30]">إدارة الأسعار - {ratesCategory?.name}</h3>
              <button onClick={() => setIsRatesModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {ratesError && (
              <div className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {ratesError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={ratesFromDate}
                    onChange={(e) => setRatesFromDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={ratesToDate}
                    onChange={(e) => setRatesToDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">السعر لليلة</label>
                <input
                  type="number"
                  value={ratesPrice}
                  onChange={(e) => setRatesPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleLoadRates}
                  className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                  disabled={isLoadingRates}
                >
                  {isLoadingRates ? 'جاري التحميل...' : 'عرض الأسعار'}
                </button>
                <button
                  onClick={handleSetRates}
                  className="flex-1 py-3 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl"
                  disabled={isSettingRates}
                >
                  {isSettingRates ? 'جاري التعيين...' : 'تعيين السعر'}
                </button>
              </div>

              {categoryRates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">الأسعار الحالية</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categoryRates.map((rate, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-600">{rate.date}</span>
                        <span className="text-sm font-bold text-[#AA7B30]">{rate.price} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room Details Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedRoom(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`border rounded-2xl p-6 max-w-2xl w-full relative space-y-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-white border-[#D4AF37]/30' : 'bg-white border-gray-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              
              <div className={`flex justify-between items-start border-b pb-4 ${isDark ? 'border-gray-200' : 'border-gray-200'}`}>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: colors.primary.goldLight }}>{selectedRoom?.name || 'غرفة'}</h3>
                  <p className="text-sm mt-1" style={{ color: colors.text.muted }}>{selectedRoom?.type || '-'} • جناح {selectedRoom?.number || '-'}</p>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className={`p-2 border rounded-lg ${isDark ? 'bg-gray-100 border-gray-200 hover:bg-gray-200' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Room Image */}
              {selectedRoom?.image && (
                <div className="relative">
                  <img
                    src={selectedRoom.image}
                    alt={selectedRoom.name}
                    className="w-full h-64 object-cover rounded-xl"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Description */}
              <div className={`p-4 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className="text-sm font-bold mb-2" style={{ color: colors.primary.goldLight }}>الوصف</h4>
                <p className="text-sm" style={{ color: colors.text.secondary }}>{selectedRoom?.description || 'غير متاح'}</p>
              </div>

              {/* Room Type & View */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-sm font-bold mb-2" style={{ color: colors.primary.goldLight }}>نوع الغرفة</h4>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>{selectedRoom?.type || 'غير متاح'}</p>
                </div>
                <div className={`p-4 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-sm font-bold mb-2" style={{ color: colors.primary.goldLight }}>الإطلالة</h4>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>{selectedRoom.viewType || 'غير متاح'}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>رقم الغرفة</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.number || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>الطابق</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.floor || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>السعر لليلة</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.primary.goldLight }}>{selectedRoom.pricePerNight ? `${selectedRoom.pricePerNight.toLocaleString('ar-SA')} ريال` : 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>أقصى عدد بالغين</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.maxAdults || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>أقصى عدد أطفال</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.maxKids || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>نوع السرير</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.bedType || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>عدد الأسرة</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.numBeds || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>عدد التلفزيونات</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.numTvs || 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl ${isDark ? 'bg-gray-50 border-gray-200/80' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="block" style={{ color: colors.text.muted }}>Wi-Fi</span>
                  <span className="text-sm font-bold block mt-1" style={{ color: colors.text.primary }}>{selectedRoom.hasWifi ? 'متاح' : 'غير متاح'}</span>
                </div>
                <div className={`p-3 border rounded-xl bg-gray-50 border-gray-200`}>
                  <span className="block text-xs font-bold text-gray-400">الحالة</span>
                  <span className={`inline-flex items-center gap-2 text-sm font-bold block mt-1 px-3 py-1 rounded-full border ${getStatusColor(selectedRoom.status || 'available')}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot(selectedRoom.status || 'available')}`}></span>
                    {getStatusLabel(selectedRoom.status || 'available')}
                  </span>
                </div>
              </div>

              {/* Status Modification */}
              <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-gray-200' : 'border-gray-200'}`}>
                <h4 className="text-sm font-bold" style={{ color: colors.text.muted }}>تغيير الحالة</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['available', 'occupied', 'cleaning', 'maintenance'] as Room['status'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        if (selectedRoom?.id) {
                          handleUpdateRoomStatus(selectedRoom.id, status);
                        }
                      }}
                      className={`px-2 py-3 rounded-lg text-xs font-bold text-center border transition-all duration-200 ${
                        selectedRoom?.status === status
                          ? 'bg-[#D4AF37] border-transparent text-black shadow-lg scale-105'
                          : 'bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
        <AnimatePresence>
          {createRoomModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setCreateRoomModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-[#AA7B30]">إضافة غرفة جديدة</h2>
                    <button
                      onClick={() => setCreateRoomModalOpen(false)}
                      className="text-gray-500 hover:text-gray-800 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {createRoomError && (
                    <div className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      {createRoomError}
                    </div>
                  )}

                  {/* Room Number */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">رقم الغرفة *</label>
                    <input
                      type="text"
                      value={newRoom.roomNumber}
                      onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                      placeholder="مثال: 101"
                      disabled={isCreatingRoom}
                    />
                  </div>

                  {/* Room Category */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">فئة الغرفة *</label>
                    <select
                      value={newRoom.categoryId}
                      onChange={(e) => setNewRoom({ ...newRoom, categoryId: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                      disabled={isCreatingRoom}
                    >
                      <option value={0}>اختر فئة الغرفة</option>
                      {roomCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Floor */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">الطابق *</label>
                    <select
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                      disabled={isCreatingRoom}
                    >
                      {floors.map((floor) => (
                        <option key={floor} value={floor}>الطابق {floor}</option>
                      ))}
                    </select>
                  </div>

                  {/* View Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">نوع الإطلالة *</label>
                    <select
                      value={newRoom.viewType}
                      onChange={(e) => setNewRoom({ ...newRoom, viewType: e.target.value as any })}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                      disabled={isCreatingRoom}
                    >
                      <option value="CITY">المدينة</option>
                      <option value="PANORAMIC">بانورامية</option>
                      <option value="SEA">البحر</option>
                      <option value="GARDEN">الحديقة</option>
                      <option value="MOUNTAIN">الجبل</option>
                      <option value="POOL">المسبح</option>
                      <option value="RIVER">النهر</option>
                      <option value="LANDMARK">معلم سياحي</option>
                    </select>
                  </div>

                  {/* Room Image Upload */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">صورة الغرفة</label>
                    <div className="space-y-3">
                      {roomImagePreview ? (
                        <div className="relative">
                          <img
                            src={roomImagePreview}
                            alt="Room preview"
                            className="w-full h-48 object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            disabled={isCreatingRoom || isCompressingImage}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#D4AF37] transition cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="roomImageInput"
                            disabled={isCreatingRoom || isCompressingImage}
                          />
                          <label htmlFor="roomImageInput" className="cursor-pointer">
                            <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">انقر لاختيار صورة</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (سيتم ضغط الصورة تلقائياً)</p>
                          </label>
                        </div>
                      )}
                      {compressionProgress && (
                        <div className="text-xs text-gray-500">
                          {compressionProgress.isCompressing && <span>جاري ضغط الصورة... {compressionProgress.progress}%</span>}
                          {compressionProgress.isUploading && <span>جاري رفع الصورة...</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#AA7B30] via-[#D4AF37] to-[#E6C587] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingRoom ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      <span>{isCreatingRoom ? 'جاري الإنشاء...' : 'إضافة الغرفة'}</span>
                    </button>
                    <button
                      onClick={() => setCreateRoomModalOpen(false)}
                      disabled={isCreatingRoom}
                      className="flex-1 px-6 py-3 bg-gray-50 border border-gray-200 text-gray-400 font-bold rounded-xl hover:text-gray-800 hover:border-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Edit Room Modal */}
      <AnimatePresence>
        {editRoomModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditRoomModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#AA7B30]">تعديل الغرفة</h3>
                  <button
                    onClick={() => setEditRoomModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {updateRoomError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
                    {updateRoomError}
                  </div>
                )}

                {/* Room Number */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">رقم الغرفة *</label>
                  <input
                    type="text"
                    value={editRoomData.roomNumber}
                    onChange={(e) => setEditRoomData({ ...editRoomData, roomNumber: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 501"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* Floor */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">الطابق</label>
                  <input
                    type="number"
                    value={editRoomData.floor}
                    onChange={(e) => setEditRoomData({ ...editRoomData, floor: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 5"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">السعر لليلة *</label>
                  <input
                    type="number"
                    value={editRoomData.price}
                    onChange={(e) => setEditRoomData({ ...editRoomData, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 1500"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* Room Type */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">نوع الغرفة</label>
                  <select
                    value={editRoomData.roomType}
                    onChange={(e) => setEditRoomData({ ...editRoomData, roomType: e.target.value as 'SINGLE' | 'DOUBLE' | 'SUITE' })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isUpdatingRoom}
                  >
                    <option value="SINGLE">غرفة مفردة</option>
                    <option value="DOUBLE">غرفة مزدوجة</option>
                    <option value="SUITE">جناح</option>
                  </select>
                </div>

                {/* Bed Type */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">نوع السرير</label>
                  <select
                    value={editRoomData.bedType}
                    onChange={(e) => setEditRoomData({ ...editRoomData, bedType: e.target.value as 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING' })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isUpdatingRoom}
                  >
                    <option value="TWIN">سريرين منفصلين</option>
                    <option value="DOUBLE">سرير مزدوج</option>
                    <option value="QUEEN">سرير كوين</option>
                    <option value="KING">سرير كينج</option>
                  </select>
                </div>

                {/* Number of Beds */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد الأسرة</label>
                  <input
                    type="number"
                    value={editRoomData.numBeds}
                    onChange={(e) => setEditRoomData({ ...editRoomData, numBeds: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 2"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* Max Adults */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد بالغين</label>
                  <input
                    type="number"
                    value={editRoomData.maxAdults}
                    onChange={(e) => setEditRoomData({ ...editRoomData, maxAdults: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 2"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* Max Kids */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد أطفال</label>
                  <input
                    type="number"
                    value={editRoomData.maxKids}
                    onChange={(e) => setEditRoomData({ ...editRoomData, maxKids: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 1"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* Number of TVs */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد التلفزيونات</label>
                  <input
                    type="number"
                    value={editRoomData.numTvs}
                    onChange={(e) => setEditRoomData({ ...editRoomData, numTvs: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    placeholder="مثال: 1"
                    disabled={isUpdatingRoom}
                  />
                </div>

                {/* View Type */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">الإطلالة</label>
                  <select
                    value={editRoomData.viewType}
                    onChange={(e) => setEditRoomData({ ...editRoomData, viewType: e.target.value as 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK' })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isUpdatingRoom}
                  >
                    <option value="CITY">المدينة</option>
                    <option value="PANORAMIC">بانورامية</option>
                    <option value="SEA">البحر</option>
                    <option value="GARDEN">الحديقة</option>
                    <option value="MOUNTAIN">الجبل</option>
                    <option value="POOL">المسبح</option>
                    <option value="RIVER">النهر</option>
                    <option value="LANDMARK">معلم سياحي</option>
                  </select>
                </div>

                {/* Wi-Fi */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editHasWifi"
                    checked={editRoomData.hasWifi}
                    onChange={(e) => setEditRoomData({ ...editRoomData, hasWifi: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                    disabled={isUpdatingRoom}
                  />
                  <label htmlFor="editHasWifi" className="text-xs font-bold text-gray-400">متاح Wi-Fi</label>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">الحالة</label>
                  <select
                    value={editRoomData.status}
                    onChange={(e) => setEditRoomData({ ...editRoomData, status: e.target.value as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isUpdatingRoom}
                  >
                    <option value="AVAILABLE">متاح</option>
                    <option value="OCCUPIED">مشغول</option>
                    <option value="CLEANING">تنظيف</option>
                    <option value="MAINTENANCE">صيانة</option>
                  </select>
                </div>

                {/* Room Image Upload */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">صورة الغرفة</label>
                  <div className="space-y-3">
                    {editRoomImagePreview ? (
                      <div className="relative">
                        <img
                          src={editRoomImagePreview}
                          alt="Room preview"
                          className="w-full h-48 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          onClick={handleEditRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          disabled={isUpdatingRoom || isCompressingImage}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#D4AF37] transition cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleEditImageSelect}
                          className="hidden"
                          id="editRoomImageInput"
                          disabled={isUpdatingRoom || isCompressingImage}
                        />
                        <label htmlFor="editRoomImageInput" className="cursor-pointer">
                          <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">انقر لاختيار صورة</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (سيتم ضغط الصورة تلقائياً)</p>
                        </label>
                      </div>
                    )}
                    {compressionProgress && (
                      <div className="text-xs text-gray-500">
                        {compressionProgress.isCompressing && <span>جاري ضغط الصورة... {compressionProgress.progress}%</span>}
                        {compressionProgress.isUploading && <span>جاري رفع الصورة...</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">الوصف</label>
                  <textarea
                    value={editRoomData.description}
                    onChange={(e) => setEditRoomData({ ...editRoomData, description: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                    rows={3}
                    placeholder="وصف الغرفة..."
                    disabled={isUpdatingRoom}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleUpdateRoom}
                    disabled={isUpdatingRoom}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#AA7B30] via-[#D4AF37] to-[#E6C587] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingRoom ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{isUpdatingRoom ? 'جاري التحديث...' : 'تحديث الغرفة'}</span>
                  </button>
                  <button
                    onClick={() => setEditRoomModalOpen(false)}
                    disabled={isUpdatingRoom}
                    className="flex-1 px-6 py-3 bg-gray-50 border border-gray-200 text-gray-400 font-bold rounded-xl hover:text-gray-800 hover:border-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
