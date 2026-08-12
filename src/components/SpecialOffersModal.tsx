import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tag, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiService, CreateSpecialOfferRequest, SpecialOfferResponse } from '../services/api';
import { compressImage, isValidImageFile, CompressionProgress } from '../utils/imageCompression';

interface SpecialOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOffer?: SpecialOfferResponse) => void;
}

export default function SpecialOffersModal({ isOpen, onClose, onSuccess }: SpecialOffersModalProps) {
  const [formData, setFormData] = useState<CreateSpecialOfferRequest>({
    title: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [createdOfferId, setCreatedOfferId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      setErrorMessage('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const createdOffer: SpecialOfferResponse = await apiService.createSpecialOffer(formData);
      setCreatedOfferId(createdOffer.id);

      // Upload image if provided
      let imageResponse = null;
      if (imageFile && createdOffer.id) {
        setIsCompressingImage(true);
        setCompressionProgress({ progress: 0, isCompressing: true, isUploading: false });
        
        try {
          const compressedFile = await compressImage(imageFile, {}, (progress) => {
            setCompressionProgress(progress);
          });
          
          setCompressionProgress({ progress: 0, isCompressing: false, isUploading: true });
          imageResponse = await apiService.uploadSpecialOfferImage(createdOffer.id, compressedFile);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Don't alert - just log and continue
          // The offer was created successfully, just image failed
        } finally {
          setIsCompressingImage(false);
          setCompressionProgress(null);
        }
      }

      setIsLoading(false);
      // Pass the offer with updated image URL
      onSuccess({ ...createdOffer, ...(imageResponse?.imageUrl ? { imageUrl: imageResponse.imageUrl } : {}) });
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
      });
      setImageFile(null);
      setImagePreview(null);
      setCreatedOfferId(null);
    } catch (error: any) {
      setIsLoading(false);
      if (error.message && error.message.includes('Authentication')) {
        setErrorMessage('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      } else {
        setErrorMessage('فشل إنشاء العرض الخاص. الرجاء المحاولة مرة أخرى.');
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#D4AF37]/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#AA7B30] flex items-center gap-2">
                  <Tag size={20} className="text-[#D4AF37]" />
                  إنشاء عرض خاص جديد
                </h2>
                <p className="text-xs text-gray-500 mt-1">أضف عرضاً خاصاً جديداً للنزلاء</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {errorMessage && (
                <div className="p-3 bg-red-50/20 border border-red-500/20 rounded-lg text-red-600 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Offer Title */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">
                  عنوان العرض <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition"
                  placeholder="مثال: عرض الصيف الفاخر"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">
                  وصف العرض <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition resize-none"
                  rows={4}
                  placeholder="وصف تفصيلي للعرض..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">
                  صورة العرض
                </label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Offer preview"
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
                        id="specialOfferImageInput"
                        disabled={isLoading || isCompressingImage}
                      />
                      <label htmlFor="specialOfferImageInput" className="cursor-pointer">
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

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-xs font-bold hover:text-gray-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      حفظ العرض
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
