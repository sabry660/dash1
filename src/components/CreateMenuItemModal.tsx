import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, ChefHat, Image as ImageIcon } from 'lucide-react';
import { apiService, CreateMenuItemRequest, MenuItemResponse } from '../services/api';
import { useThemeColors } from '../hooks/useThemeColors';
import { compressImage, isValidImageFile, CompressionProgress } from '../utils/imageCompression';

interface CreateMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem?: MenuItemResponse) => void;
  editingItem?: MenuItemResponse | null;
}

export default function CreateMenuItemModal({ isOpen, onClose, onSuccess, editingItem }: CreateMenuItemModalProps) {
  const { colors, isDark } = useThemeColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('FOOD');
  const [available, setAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [createdItemId, setCreatedItemId] = useState<number | null>(null);

  // Populate form when editing
  React.useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setDescription(editingItem.description || '');
      setPrice(editingItem.price || 0);
      setCategory(editingItem.category || 'FOOD');
      setAvailable(editingItem.available !== false);
      setImagePreview(editingItem.imageUrl || null);
    } else {
      // Reset form for create mode
      setName('');
      setDescription('');
      setPrice(0);
      setCategory('FOOD');
      setAvailable(true);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async () => {
    if (!name || !price) {
      setErrorMessage('الرجاء تعبئة الحقول المطلوبة (الاسم والسعر)');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      let resultItem: MenuItemResponse;

      if (editingItem) {
        // Update existing item
        const updateRequest = {
          name,
          description,
          price,
          category,
          available
        };

        if (category === 'FOOD') {
          resultItem = await apiService.updateRestaurantMenuItem(editingItem.id, updateRequest);
        } else if (category === 'DRINK') {
          resultItem = await apiService.updateCafeMenuItem(editingItem.id, updateRequest);
        } else if (category === 'ROOM_SERVICE') {
          resultItem = await apiService.updateRoomServiceMenuItem(editingItem.id, updateRequest);
        } else {
          // Fallback - try restaurant update for unknown categories
          resultItem = await apiService.updateRestaurantMenuItem(editingItem.id, updateRequest);
        }
      } else {
        // Create new item
        const menuItemRequest: CreateMenuItemRequest = {
          name,
          description,
          price,
          category,
          available
        };

        if (category === 'FOOD') {
          resultItem = await apiService.createRestaurantMenuItem(menuItemRequest);
        } else if (category === 'DRINK') {
          resultItem = await apiService.createCafeMenuItem(menuItemRequest);
        } else if (category === 'ROOM_SERVICE') {
          resultItem = await apiService.createRoomServiceMenuItem(menuItemRequest);
        } else {
          resultItem = await apiService.createMenuItemByCategory(menuItemRequest, category);
        }
      }

      setCreatedItemId(resultItem.id);

      // Upload image if provided
      let imageResponse = null;
      if (imageFile && resultItem.id) {
        setIsCompressingImage(true);
        setCompressionProgress({ progress: 0, isCompressing: true, isUploading: false });
        
        try {
          const compressedFile = await compressImage(imageFile, {}, (progress) => {
            setCompressionProgress(progress);
          });
          
          setCompressionProgress({ progress: 0, isCompressing: false, isUploading: true });

          // Upload based on category
          if (category === 'FOOD') {
            imageResponse = await apiService.uploadRestaurantMenuImage(resultItem.id, compressedFile);
          } else if (category === 'DRINK') {
            imageResponse = await apiService.uploadCafeMenuImage(resultItem.id, compressedFile);
          } else if (category === 'ROOM_SERVICE') {
            imageResponse = await apiService.uploadRoomServiceMenuImage(resultItem.id, compressedFile);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue even if image upload fails
        } finally {
          setIsCompressingImage(false);
          setCompressionProgress(null);
        }
      }
      
      setIsLoading(false);
      // Pass the item with updated image URL
      onSuccess({ ...resultItem, ...(imageResponse?.imageUrl ? { imageUrl: imageResponse.imageUrl } : {}) });
      onClose();
      
      // Reset form
      setName('');
      setDescription('');
      setPrice(0);
      setCategory('FOOD');
      setAvailable(true);
      setImageFile(null);
      setImagePreview(null);
      setCreatedItemId(null);
      setErrorMessage('');
    } catch (error: any) {
      setIsLoading(false);
      if (error.message && error.message.includes('Authentication')) {
        setErrorMessage('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      } else {
        setErrorMessage('فشل حفظ العنصر. الرجاء المحاولة مرة أخرى.');
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setErrorMessage('يرجى اختيار صورة بصيغة JPG, PNG أو WebP');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-white border-[#D4AF37]/30' : 'bg-white border-gray-200'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: `${colors.primary.gold}20`, borderColor: `${colors.primary.gold}30`, border: '1px solid' }}>
                  <ChefHat size={20} style={{ color: colors.primary.goldLight }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: colors.primary.goldLight }}>
                  {editingItem ? 'تعديل عنصر' : 'إنشاء عنصر جديد'}
                </h3>
              </div>
              <button onClick={onClose} className={`p-2 border rounded-lg ${isDark ? 'bg-gray-900 border-gray-200' : 'bg-gray-100 border-gray-300'}`}>
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className={`border text-sm p-3 rounded-lg mb-4 ${isDark ? 'bg-red-50/40 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-2 font-bold text-gray-400">الاسم *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition"
                  placeholder="مثال: برجر لحم"
                  required
                />
              </div>

              <div>
                <label className="text-xs block mb-2 font-bold text-gray-400">الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition resize-none"
                  placeholder="وصف تفصيلي للعنصر..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs block mb-2 font-bold text-gray-400">السعر *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-xs block mb-2 font-bold text-gray-400">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition"
                >
                  <option value="FOOD">طعام (Food)</option>
                  <option value="DRINK">مشروبات (Drink)</option>
                  <option value="ROOM_SERVICE">خدمة الغرف (Room Service)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 rounded focus:ring-offset-0 bg-gray-50 border-gray-200 focus:ring-[#D4AF37]"
                />
                <label htmlFor="available" className="text-xs font-bold text-gray-600">
                  متوفر
                </label>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs block mb-2" style={{ color: colors.text.muted }}>صورة العنصر</label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Item preview"
                        className="w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        disabled={isLoading || isCompressingImage}
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
                        id="menuItemImageInput"
                        disabled={isLoading || isCompressingImage}
                      />
                      <label htmlFor="menuItemImageInput" className="cursor-pointer">
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

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-gray-200' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition ${isDark ? 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-800' : 'bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 text-black font-extrabold text-xs rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                  style={{ background: colors.primary.goldGradient }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
