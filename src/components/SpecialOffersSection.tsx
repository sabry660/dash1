import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Tag, Plus, X, Edit, Trash2, Save, Loader2, Sparkles, 
  Search, ChevronDown, ChevronUp, Image as ImageIcon
} from 'lucide-react';
import { apiService, SpecialOfferResponse } from '../services/api';
import SpecialOffersModal from './SpecialOffersModal';
import { compressImage, isValidImageFile, CompressionProgress } from '../utils/imageCompression';

export default function SpecialOffersSection() {
  const [offers, setOffers] = useState<SpecialOfferResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOfferResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState<Record<number, boolean>>({});
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getSpecialOffers(0, 50);
      // Sort offers by ID ascending
      const sortedOffers = (response.content || []).sort((a, b) => a.id - b.id);
      setOffers(sortedOffers);
    } catch (error: any) {
      if (error.message && error.message.includes('Authentication')) {
        setError('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      } else {
        setError('فشل الاتصال بالخادم. الرجاء المحاولة مرة أخرى.');
      }
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = (newOffer?: SpecialOfferResponse) => {
    if (newOffer) {
      // Add new offer and sort by ID ascending
      setOffers(prevOffers => {
        const updatedOffers = [...prevOffers, newOffer];
        return updatedOffers.sort((a, b) => a.id - b.id);
      });
    } else {
      loadOffers();
    }
  };

  const handleEdit = (offer: SpecialOfferResponse) => {
    setEditingOffer(offer);
    setEditImagePreview(offer.imageUrl || null);
    setEditImageFile(null);
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      alert('يرجى اختيار صورة بصيغة JPG, PNG أو WebP');
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleEditRemoveImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleUpdate = async (id: number, offerData: { title?: string; description?: string }) => {
    try {
      const updatedOffer = await apiService.patchSpecialOffer(id, offerData);

      // Upload image if provided
      let imageResponse = null;
      if (editImageFile) {
        setIsCompressingImage(true);
        setCompressionProgress({ progress: 0, isCompressing: true, isUploading: false });
        
        try {
          const compressedFile = await compressImage(editImageFile, {}, (progress) => {
            setCompressionProgress(progress);
          });
          
          setCompressionProgress({ progress: 0, isCompressing: false, isUploading: true });
          imageResponse = await apiService.uploadSpecialOfferImage(id, compressedFile);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue even if image upload fails
        } finally {
          setIsCompressingImage(false);
          setCompressionProgress(null);
        }
      }

      // Update offer locally to maintain position
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer.id === id ? { 
            ...offer, 
            ...updatedOffer,
            // Update image URL if upload was successful
            ...(imageResponse?.imageUrl ? { imageUrl: imageResponse.imageUrl } : {})
          } : offer
        )
      );
      
      setEditingOffer(null);
      setEditImageFile(null);
      setEditImagePreview(null);
    } catch (error) {
      alert('فشل تحديث العرض. الرجاء المحاولة مرة أخرى.');
    }
  };

  const toggleExpand = (id: number) => {
    setIsExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredOffers = (offers || []).filter(offer =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#AA7B30] flex items-center gap-2">
            <Sparkles size={24} className="text-[#D4AF37]" />
            العروض والمزايا
          </h1>
          <p className="text-gray-500 text-xs mt-1">إدارة العروض الخاصة والمزايا للنزلاء</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] hover:from-[#C59740] hover:to-[#D4AF37] text-black font-extrabold text-xs rounded-xl shadow-lg transition duration-200"
        >
          <Plus size={15} />
          <span>عرض جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="بحث في العروض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-10 pl-4 py-2.5 text-xs text-gray-800 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <X size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-400 mb-2">فشل تحميل العروض</h3>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadOffers}
            className="px-4 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {filteredOffers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
              <Tag size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-400 mb-2">لا توجد عروض حالياً</h3>
              <p className="text-xs text-gray-600 mb-4">ابدأ بإضافة عرض جديد للنزلاء</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl"
              >
                إضافة عرض
              </button>
            </div>
          ) : (
            /* Offers Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredOffers.map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <div className="relative backdrop-blur-xl border rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] transition-all duration-500 hover:-translate-y-2 group bg-white border-gray-200">
                    {/* Offer Image */}
                    <div className="relative h-64 overflow-hidden">
                      {offer.imageUrl ? (
                        <img 
                          src={offer.imageUrl} 
                          alt={offer.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { 
                            e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600";
                          }}
                        />
                      ) : (
                        <img 
                          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600" 
                          alt={offer.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg bg-green-500/20 text-green-400 border-green-500/30">
                          <span className="w-2 h-2 rounded-full bg-green-400"></span>
                          <span>نشط</span>
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-3xl font-black font-mono text-white drop-shadow-lg">#{offer.id}</span>
                      </div>
                    </div>

                    {/* Offer Info */}
                    <div className="p-6 space-y-4">
                      {/* Title */}
                      <h3 className="text-xl font-black text-gray-900">{offer.title}</h3>

                      {/* Description */}
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="block text-gray-400 text-xs mb-2">الوصف</span>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {isExpanded[offer.id] 
                            ? offer.description 
                            : offer.description.length > 150 
                              ? `${offer.description.substring(0, 150)}...` 
                              : offer.description
                          }
                        </p>
                        {offer.description.length > 150 && (
                          <button
                            onClick={() => toggleExpand(offer.id)}
                            className="mt-2 text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
                          >
                            {isExpanded[offer.id] ? (
                              <>
                                <ChevronUp size={10} />
                                عرض أقل
                              </>
                            ) : (
                              <>
                                <ChevronDown size={10} />
                                عرض المزيد
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30 hover:bg-amber-50 transition-all duration-300"
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

      {/* Create Offer Modal */}
      <SpecialOffersModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Offer Modal */}
      {editingOffer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D4AF37]/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#AA7B30]">تعديل العرض</h3>
              <button onClick={() => {
                setEditingOffer(null);
                setEditImageFile(null);
                setEditImagePreview(null);
              }} className="p-2 bg-gray-100 border border-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 block mb-2">العنوان</label>
                <input
                  type="text"
                  defaultValue={editingOffer.title}
                  id="editTitle"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-2">الوصف</label>
                <textarea
                  defaultValue={editingOffer.description}
                  id="editDescription"
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs text-gray-600 block mb-2">صورة العرض</label>
                <div className="space-y-3">
                  {editImagePreview ? (
                    <div className="relative">
                      <img
                        src={editImagePreview}
                        alt="Offer preview"
                        className="w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        onClick={handleEditRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        disabled={isCompressingImage}
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
                        id="editOfferImageInput"
                        disabled={isCompressingImage}
                      />
                      <label htmlFor="editOfferImageInput" className="cursor-pointer">
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

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOffer(null);
                    setEditImageFile(null);
                    setEditImagePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:text-gray-900 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const title = (document.getElementById('editTitle') as HTMLInputElement).value;
                    const description = (document.getElementById('editDescription') as HTMLTextAreaElement).value;
                    handleUpdate(editingOffer.id, { title, description });
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                  disabled={isCompressingImage}
                >
                  {isCompressingImage ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
