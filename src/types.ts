export interface Room {
  id: string;
  number: string;
  name: string;
  description: string;
  type: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  floor: number;
  pricePerNight: number;
  maxAdults: number;
  maxKids: number;
  categoryId: number;
  image?: string;
  images?: string[];
  bedType?: 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING';
  numBeds?: number;
  numTvs?: number;
  viewType?: 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK';
  hasWifi?: boolean;
  amenities?: string[];
}

export interface MaintenanceLog {
  date: string;
  issue: string;
  technician: string;
  cost: number;
  status: 'completed' | 'pending';
}

export interface CleaningLog {
  date: string;
  staff: string;
  duration: number;
  quality: number;
}

export interface Reservation {
  id: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  status: 'checked_in' | 'checked_out' | 'upcoming' | 'cancelled';
  amount: number;
  guestId: string;
  adultCount: number;
  childrenCount: number;
  paymentStatus?: 'paid' | 'partial' | 'pending' | 'refunded';
  depositAmount?: number;
  guestNotes?: string;
  specialRequests?: string[];
  bookingSource?: 'direct' | 'booking.com' | 'expedia' | 'agoda' | 'airbnb' | 'corporate' | 'group';
  discountCode?: string;
  voucherCode?: string;
  isGroupBooking?: boolean;
  isCorporateBooking?: boolean;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVIP: boolean;
  stayCount: number;
  notes: string;
  avatarUrl?: string;
  nationality: string;
  language?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  previousStays?: PreviousStay[];
  totalSpending?: number;
  preferredRoom?: string;
  pillowPreference?: string;
  favoriteFoods?: string[];
  foodAllergies?: string[];
  roomPreferences?: string[];
  visitReason?: string;
  childrenCount?: number;
  loyaltyPoints?: number;
  ratings?: GuestRating[];
  supportTickets?: SupportTicket[];
  chatHistory?: ChatMessage[];
  marketingConsent?: boolean;
  lastEmailOpen?: string;
  lastSmsOpen?: string;
  lifetimeValue?: number;
  referralSource?: string;
}

export interface PreviousStay {
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  amount: number;
}

export interface GuestRating {
  date: string;
  rating: number;
  category: string;
  comments?: string;
}

export interface SupportTicket {
  id: string;
  date: string;
  issue: string;
  status: 'open' | 'resolved' | 'closed';
  response?: string;
}

export interface ChatMessage {
  date: string;
  message: string;
  from: 'guest' | 'hotel';
  read: boolean;
}

export interface ServiceRequest {
  id: string;
  roomNumber: string;
  type: 'room_service' | 'laundry' | 'housekeeping' | 'maintenance' | 'taxi' | 'reception' | 'spa' | 'airport_pickup' | 'lost_found';
  details: string;
  status: 'pending' | 'assigned' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  timestamp: string;
  completionTime?: number;
  averageCompletionTime?: number;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  status: 'pending' | 'cleaning' | 'completed';
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  lastCleaned?: string;
  qualityInspector?: string;
  checklist?: HousekeepingChecklist;
  beforePhotos?: string[];
  afterPhotos?: string[];
  materialsUsed?: string[];
  cleaningTime?: number;
  staffRating?: number;
}

export interface HousekeepingChecklist {
  bedMade: boolean;
  bathroomCleaned: boolean;
  towelsReplaced: boolean;
  amenitiesRestocked: boolean;
  floorsVacuumed: boolean;
  trashEmptied: boolean;
}

export interface MaintenanceTicket {
  id: string;
  roomNumber: string;
  issue: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'completed';
  technician?: string;
  dateCreated: string;
  estimatedCost?: number;
  actualCost?: number;
  completionDate?: string;
}

export interface RestaurantOrder {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'ordered' | 'preparing' | 'delivered' | 'completed';
  total: number;
  time: string;
  server?: string;
  orderType?: 'dine_in' | 'room_service' | 'takeaway';
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  guestName: string;
  roomNumber: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'refunded';
  date: string;
  method: 'بوابة دفع إلكترونية' | 'بطاقة ائتمان' | 'نقدًا' | 'تحويل بنكي' | 'apple_pay' | 'google_pay';
  tax?: number;
  vat?: number;
  installmentPlan?: boolean;
  installmentCount?: number;
}

export interface MarketingMetric {
  date: string;
  visitors: number;
  bookings: number;
  conversion: number;
  seoRank: number;
  source?: string;
  campaign?: string;
  roi?: number;
}

export interface Staff {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: 'active' | 'on_leave' | 'inactive';
  attendance?: AttendanceRecord[];
  performance?: PerformanceMetrics;
  completedTasks?: number;
  averageResponseTime?: number;
  shiftSchedule?: ShiftSchedule[];
  rewards?: Reward[];
}

export interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'leave';
}

export interface PerformanceMetrics {
  rating: number;
  completedTasks: number;
  customerSatisfaction: number;
  efficiency: number;
}

export interface ShiftSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Reward {
  date: string;
  type: string;
  amount: number;
  reason: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  platform: 'email' | 'sms' | 'instagram' | 'facebook' | 'tiktok' | 'x';
  status: 'active' | 'completed' | 'scheduled';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  conversions: number;
  roi: number;
}

export interface Review {
  id: string;
  platform: 'google' | 'tripadvisor' | 'booking.com' | 'expedia' | 'agoda';
  guestName: string;
  rating: number;
  date: string;
  comment: string;
  response?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface GoogleBusinessData {
  views: number;
  calls: number;
  directionsRequests: number;
  websiteVisits: number;
  searches: number;
  reviews: number;
  averageRating: number;
  photos: number;
  questions: number;
  posts: number;
  optimizationScore: number;
}

export interface AIInsight {
  id: string;
  type: 'revenue_prediction' | 'occupancy_forecast' | 'offer_suggestion' | 'seo_recommendation' | 'sentiment_analysis' | 'revenue_opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  date: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'occupancy' | 'adr' | 'revenue' | 'profit' | 'marketing' | 'staff' | 'guests' | 'housekeeping' | 'restaurant';
  dateRange: string;
  generatedAt: string;
  data: any;
  format: 'pdf' | 'excel' | 'csv';
}
