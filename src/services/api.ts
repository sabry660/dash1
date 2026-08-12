// API Service for LYTC Hotel Management Dashboard
// Base URL: https://lytc-hotel-backend.onrender.com

const API_BASE_URL = 'https://lytc-hotel-backend.onrender.com';

// Types based on OpenAPI specification
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: string;
  userId: number;
  username: string;
  tokenType: string;
}

interface CreateSpecialOfferRequest {
  title: string;
  description: string;
}

interface SpecialOfferResponse {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
}

interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime?: number;
  imageUrl?: string;
}

interface UpdateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  available?: boolean;
  category: 'FOOD' | 'DRINK' | 'SERVICE';
}

interface PatchMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  available?: boolean;
  category?: 'FOOD' | 'DRINK' | 'SERVICE';
}

interface CreateOrderRequest {
  category: 'FOOD' | 'DRINK' | 'SERVICE';
  items: OrderItemRequest[];
}

interface RoomResponse {
  id: number;
  roomNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  floor: number;
  viewType: 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK';
  description: string;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
  price: number;
  maxAdults: number;
  maxKids: number;
  numBeds: number;
  bedType: 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING';
  hasWifi: boolean;
  numTvs: number;
}

interface CreateRoomRequest {
  roomNumber: string;
  categoryId: number;
  floor?: number;
  viewType: 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK';
  description?: string;
}

interface UpdateRoomRequest {
  roomNumber: string;
  categoryId: number;
  floor?: number;
  viewType: 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK';
  description?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
}

interface PatchRoomRequest {
  roomNumber?: string;
  categoryId?: number;
  floor?: number;
  viewType?: 'CITY' | 'PANORAMIC' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'RIVER' | 'LANDMARK';
  description?: string;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
}

// Room Category related types
interface RoomCategoryResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  numBeds: number;
  bedType: 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING';
  maxAdults: number;
  maxKids: number;
  hasWifi: boolean;
  numTvs: number;
  imageUrl: string;
}

interface CreateRoomCategoryRequest {
  name: string;
  description?: string;
  price: number;
  numBeds: number;
  bedType: 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING';
  maxAdults: number;
  maxKids: number;
  hasWifi: boolean;
  numTvs: number;
}

interface UpdateRoomCategoryRequest {
  name?: string;
  description?: string;
  price?: number;
  numBeds?: number;
  bedType?: 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING';
  maxAdults?: number;
  maxKids?: number;
  hasWifi?: boolean;
  numTvs?: number;
}

interface DailyRateResponse {
  date: string;
  price: number;
  customRate: boolean;
}

interface SetRatesRequest {
  startDate: string;
  endDate: string;
  price: number;
}

// Stays related types
interface StayDetailsResponse {
  stayId: number;
  expectedCheckInDate: string;
  checkInTime: string;
  expectedCheckOutDate: string;
  checkOutTime: string;
  status: 'RESERVED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'NO_SHOW';
  stars: number;
  notes: string;
  roomCharge: number;
  totalCharge: number;
  guestId: number;
  guestName: string;
  guestPhone: string;
  email: string;
  nationality: string;
  identification: string;
  roomId: number;
  roomNumber: string;
  floor: number;
  description: string;
  maxAdults: number;
  maxKids: number;
  numAdults: number;
  numKids: number;
}

interface CreateStayRequest {
  guestName: string;
  phone: string;
  email?: string;
  nationality?: string;
  identification?: string;
  roomNumber: string;
  numAdults: number;
  numKids?: number;
  expectedCheckInDate: string;
  expectedCheckOutDate: string;
  dateRangeValid?: boolean;
}

interface CreateSpecialOrderRequest {
  specialOfferId: number;
  agreedPrice: number;
}

interface SpecialOrderResponse {
  id: number;
  stayId: number;
  specialOffer: SpecialOfferResponse;
  agreedPrice: number;
  createdAt: string;
  status: string;
  completedAt?: string;
}

interface ExtendStayRequest {
  newCheckOutDate: string;
}

interface PageStayDetailsResponse {
  content: StayDetailsResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  empty: boolean;
}

interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

interface OrderItemDetailResponse {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface OrderResponse {
  orderId: number;
  roomNumber: string;
  guestName: string;
  category: 'FOOD' | 'DRINK' | 'SERVICE';
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  items: OrderItemDetailResponse[];
}

interface UpdateOrderStatusRequest {
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

interface MenuItemResponse {
  id: number;
  name: string;
  description: string;
  category: 'FOOD' | 'DRINK' | 'SERVICE';
  price: number;
  available: boolean;
  imageUrl?: string;
}

// Manager related types
interface UserResponse {
  id: number;
  username: string;
  role: string;
}

interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
}

interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: string;
}

interface PageUserResponse {
  content: UserResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  empty: boolean;
}

interface EmployeeResponse {
  id: number;
  fullName: string;
  phone: string;
  job: string;
  department: string;
  status: string;
}

interface CreateEmployeeRequest {
  fullName: string;
  phone: string;
  job: string;
  department: string;
  status?: string;
}

interface UpdateEmployeeStatusRequest {
  status: string;
}

interface PageEmployeeResponse {
  content: EmployeeResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  empty: boolean;
}

interface VipResponse {
  id: number;
  fullName: string;
  phone: string;
  nationality: string;
  notes: string;
}

interface CreateVipRequest {
  fullName: string;
  phone?: string;
  nationality?: string;
  notes?: string;
}

interface PageVipResponse {
  content: VipResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  empty: boolean;
}

// Reservation Request related types
interface ReservationRequestResponse {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  nationality: string;
  identification: string;
  categoryId: number;
  categoryName: string;
  checkInDate: string;
  checkOutDate: string;
  numAdults: number;
  numKids: number;
  quotedTotalCharge: number;
  status: string;
  notes: string;
  rejectionReason: string;
  processedByUserId: number;
  processedAt: string;
  createdAt: string;
}

interface SubmitReservationRequest {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  nationality?: string;
  identification?: string;
  categoryId: number;
  checkInDate: string;
  checkOutDate: string;
  numAdults: number;
  numKids?: number;
  notes?: string;
}

interface ApproveReservationRequest {
  roomId: number;
}

interface RejectReservationRequest {
  reason: string;
}

// Stats related types
interface DashboardStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTimeMinutes: number;
  completedOrders: number;
  pendingOrders?: number;
}

interface PendingOrdersResponse {
  orderId: number;
  roomNumber: string;
  guestName: string;
  category: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items: OrderItemDetailResponse[];
}

// Manager Overview types
interface ManagerOverviewResponse {
  totalPendingOrders: number;
  totalOrdersCompletedToday: number;
  totalRevenueToday: number;
  totalRevenue: number;
  totalClosedStays: number;
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
  adr: number;
  revPar: number;
  totalRevenueThisMonth: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  currentGuests: number;
  roomsOutOfService: number;
  averageStayDays: number;
  cancellationRate: number;
}

interface OccupancyResponse {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
}

// Receipt types
interface ReceiptResponse {
  stayId: number;
  guestName: string;
  checkInTime: string;
  checkOutTime: string;
  roomNumber: string;
  roomCharge: number;
  menuOrders: ReceiptItem[];
  specialOrders: ReceiptItem[];
  totalCharge: number;
}

interface ReceiptItem {
  description: string;
  amount: number;
  date: string;
}

// Full Stay Summary
interface FullStaySummaryResponse {
  stayDetails: StayDetailsResponse;
  financialSummary: FinancialSummary;
  orders: OrderResponse[];
  specialOrders: SpecialOrderResponse[];
}

interface FinancialSummary {
  roomCharge: number;
  regularOrdersTotal: number;
  specialOrdersTotal: number;
  grandTotal: number;
}

// Pageable types
interface Pageable {
  page: number;
  size: number;
  sort?: string[];
}

interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface PagedModelRoomResponse {
  content: RoomResponse[];
  page: PageMetadata;
}

interface PagedModelStayDetailsResponse {
  content: StayDetailsResponse[];
  page: PageMetadata;
}

interface PagedModelReservationRequestResponse {
  content: ReservationRequestResponse[];
  page: PageMetadata;
}

interface PagedModelSpecialOrderResponse {
  content: SpecialOrderResponse[];
  page: PageMetadata;
}

// API Service Class
class APIService {
  private baseURL: string;
  private token: string | null = null;
  private hotelId: string | null = null;
  private tenantId: string | null = null;
  private isRefreshing: boolean = false;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    // Load hotel ID from localStorage on initialization
    this.hotelId = localStorage.getItem('hotel_id');
    // Load tenant ID from localStorage on initialization
    this.tenantId = localStorage.getItem('tenant_id');
  }

  // Set hotel ID
  setHotelId(hotelId: string): void {
    this.hotelId = hotelId;
    localStorage.setItem('hotel_id', hotelId);
  }

  // Get hotel ID
  getHotelId(): string | null {
    return this.hotelId;
  }

  // Clear hotel ID
  clearHotelId(): void {
    this.hotelId = null;
    localStorage.removeItem('hotel_id');
  }

  // Set tenant ID
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
    localStorage.setItem('tenant_id', tenantId);
  }

  // Get tenant ID
  getTenantId(): string | null {
    return this.tenantId;
  }

  // Clear tenant ID
  clearTenantId(): void {
    this.tenantId = null;
    localStorage.removeItem('tenant_id');
  }

  // Helper method to get headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Always include Authorization header if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Always include X-Tenant-ID header if tenantId is available
    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    return headers;
  }

  // Helper method to handle response with automatic token refresh
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      let errorMsg = `خطأ في الخادم (${response.status})`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMsg = errorJson.message || errorJson.error || errorJson.detail || errorMsg;
      } catch { }
      throw new Error(errorMsg);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json();
  }

  // Helper method to make authenticated requests with automatic token refresh
  private async authenticatedFetch<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const makeRequest = async (): Promise<Response> => {
      return fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {}),
        },
      });
    };

    let response = await makeRequest();

    // If 401 and not already refreshing, try to refresh token
    if (response.status === 401 && this.token && !this.isRefreshing) {
      this.isRefreshing = true;
      try {
        await this.refreshToken();
        this.isRefreshing = false;
        // Retry the request with new token
        response = await makeRequest();
      } catch (refreshError) {
        this.isRefreshing = false;
        // If refresh fails, clear token and redirect to login
        this.clearToken();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }
    }

    return this.handleResponse<T>(response);
  }

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // ==================== AUTHENTICATION APIs ====================

  /**
   * Login API
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
      },
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<LoginResponse>(response);

    // Store token if present in response
    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Refresh Token API
   * POST /api/auth/refresh
   */
  async refreshToken(): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
      },
    });

    const data = await this.handleResponse<LoginResponse>(response);

    // Update token if present in response
    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Logout API
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
      },
    });

    await this.handleResponse<void>(response);

    // Clear token from storage
    this.clearToken();
  }

  // ==================== SPECIAL OFFERS APIs ====================

  /**
   * Create Special Offer API
   * POST /api/dashboard/front-desk/special-offers
   */
  async createSpecialOffer(offer: CreateSpecialOfferRequest): Promise<SpecialOfferResponse> {
    return this.authenticatedFetch<SpecialOfferResponse>(
      `${this.baseURL}/api/dashboard/front-desk/special-offers`,
      {
        method: 'POST',
        body: JSON.stringify(offer),
      }
    );
  }

  /**
   * Patch Special Offer API (partial update)
   * PATCH /api/dashboard/front-desk/special-offers/{id}
   */
  async patchSpecialOffer(id: number, offer: { title?: string; description?: string }): Promise<SpecialOfferResponse> {
    return this.authenticatedFetch<SpecialOfferResponse>(
      `${this.baseURL}/api/dashboard/front-desk/special-offers/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(offer),
      }
    );
  }

  /**
   * Get Special Offers for Guest
   * GET /api/guest/special-offers
   */
  async getSpecialOffers(page: number = 0, size: number = 10): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/guest/special-offers?page=${page}&size=${size}`,
      {
        method: 'GET',
      }
    );
  }

  // ==================== MENU ITEMS APIs ====================

  /**
   * Create Menu Item for Room Service
   * POST /api/dashboard/room-service/menu
   */
  async createRoomServiceMenuItem(item: CreateMenuItemRequest): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/room-service/menu`,
      {
        method: 'POST',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Create Menu Item for Restaurant
   * POST /api/dashboard/restaurant/menu
   */
  async createRestaurantMenuItem(item: CreateMenuItemRequest): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/restaurant/menu`,
      {
        method: 'POST',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Create Menu Item for Cafe
   * POST /api/dashboard/cafe/menu
   */
  async createCafeMenuItem(item: CreateMenuItemRequest): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/cafe/menu`,
      {
        method: 'POST',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Update Menu Item for Room Service
   * PUT /api/dashboard/room-service/menu/{id}
   */
  async updateRoomServiceMenuItem(id: number, item: Partial<CreateMenuItemRequest>): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/room-service/menu/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Update Menu Item for Restaurant
   * PUT /api/dashboard/restaurant/menu/{id}
   */
  async updateRestaurantMenuItem(id: number, item: Partial<CreateMenuItemRequest>): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/restaurant/menu/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Update Menu Item for Cafe
   * PUT /api/dashboard/cafe/menu/{id}
   */
  async updateCafeMenuItem(id: number, item: Partial<CreateMenuItemRequest>): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/cafe/menu/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Patch Menu Item for Room Service (partial update)
   * PATCH /api/dashboard/room-service/menu/{id}
   */
  async patchRoomServiceMenuItem(id: number, item: Partial<CreateMenuItemRequest>): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/room-service/menu/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Patch Menu Item for Restaurant (partial update)
   * PATCH /api/dashboard/restaurant/menu/{id}
   */
  async patchRestaurantMenuItem(id: number, item: Partial<CreateMenuItemRequest>): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/restaurant/menu/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(item),
      }
    );
  }

  /**
   * Patch Menu Item for Cafe (partial update)
   * PATCH /api/dashboard/cafe/menu/{id}
   */
  async patchCafeMenuItem(id: number, item: Partial<CreateMenuItemRequest>): Promise<MenuItemResponse> {
    return this.authenticatedFetch<MenuItemResponse>(
      `${this.baseURL}/api/dashboard/cafe/menu/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(item),
      }
    );
  }

  // ==================== ORDER APIs ====================

  /**
   * Create Order for Guest
   * POST /api/guest/orders
   */
  async createGuestOrder(roomNumber: string, order: CreateOrderRequest): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/guest/orders?roomNumber=${roomNumber}`,
      {
        method: 'POST',
        body: JSON.stringify(order),
      }
    );
  }

  /**
   * Get Guest Orders
   * GET /api/guest/orders
   */
  async getGuestOrders(roomNumber: string, page: number = 0, size: number = 10): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/guest/orders?roomNumber=${roomNumber}&page=${page}&size=${size}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Cancel Order
   * POST /api/guest/orders/{orderId}/cancel
   */
  async cancelOrder(orderId: number, roomNumber: string): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/guest/orders/${orderId}/cancel?roomNumber=${roomNumber}`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Get Order Details
   * GET /api/guest/orders/{orderId}
   */
  async getOrderDetails(orderId: number, roomNumber: string): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/guest/orders/${orderId}?roomNumber=${roomNumber}`,
      {
        method: 'GET',
      }
    );
  }

  // ==================== ROOMS APIs ====================

  /**
   * Get Rooms
   * GET /api/dashboard/front-desk/rooms
   */
  async getRooms(
    status?: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE',
    floor?: number,
    page: number = 0,
    size: number = 10
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (status) params.append('status', status);
    if (floor !== undefined) params.append('floor', floor.toString());

    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/front-desk/rooms?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Create Room
   * POST /api/dashboard/front-desk/rooms
   */
  async createRoom(room: CreateRoomRequest): Promise<RoomResponse> {
    return this.authenticatedFetch<RoomResponse>(
      `${this.baseURL}/api/dashboard/front-desk/rooms`,
      {
        method: 'POST',
        body: JSON.stringify(room),
      }
    );
  }

  /**
   * Update Room
   * PUT /api/dashboard/front-desk/rooms/{id}
   */
  async updateRoom(id: number, room: UpdateRoomRequest): Promise<RoomResponse> {
    return this.authenticatedFetch<RoomResponse>(
      `${this.baseURL}/api/dashboard/front-desk/rooms/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(room),
      }
    );
  }

  /**
   * Patch Room (partial update)
   * PATCH /api/dashboard/front-desk/rooms/{id}
   */
  async patchRoom(id: number, room: PatchRoomRequest): Promise<RoomResponse> {
    return this.authenticatedFetch<RoomResponse>(
      `${this.baseURL}/api/dashboard/front-desk/rooms/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(room),
      }
    );
  }

  /**
   * Delete Room
   * DELETE /api/dashboard/front-desk/rooms/{id}
   */
  async deleteRoom(id: number): Promise<void> {
    return this.authenticatedFetch<void>(
      `${this.baseURL}/api/dashboard/front-desk/rooms/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Upload Room Image
   * POST /api/dashboard/front-desk/rooms/{id}/image
   */
  async uploadRoomImage(id: number, file: File): Promise<RoomResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete headers['Content-Type'];

    const url = `${this.baseURL}/api/dashboard/front-desk/rooms/${id}/image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
      },
    });

    return this.handleResponse<RoomResponse>(response);
  }

  /**
   * Upload Restaurant Menu Image
   * POST /api/dashboard/restaurant/menu/{id}/image
   */
  async uploadRestaurantMenuImage(id: number, file: File): Promise<MenuItemResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete headers['Content-Type'];

    const url = `${this.baseURL}/api/dashboard/restaurant/menu/${id}/image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
      },
    });

    return this.handleResponse<MenuItemResponse>(response);
  }

  /**
   * Upload Cafe Menu Image
   * POST /api/dashboard/cafe/menu/{id}/image
   */
  async uploadCafeMenuImage(id: number, file: File): Promise<MenuItemResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete headers['Content-Type'];

    const url = `${this.baseURL}/api/dashboard/cafe/menu/${id}/image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
      },
    });

    return this.handleResponse<MenuItemResponse>(response);
  }

  /**
   * Upload Room Service Menu Image
   * POST /api/dashboard/room-service/menu/{id}/image
   */
  async uploadRoomServiceMenuImage(id: number, file: File): Promise<MenuItemResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete headers['Content-Type'];

    const url = `${this.baseURL}/api/dashboard/room-service/menu/${id}/image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
      },
    });

    return this.handleResponse<MenuItemResponse>(response);
  }

  /**
   * Upload Special Offer Image
   * POST /api/dashboard/front-desk/special-offers/{id}/image
   */
  async uploadSpecialOfferImage(id: number, file: File): Promise<SpecialOfferResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete headers['Content-Type'];

    const url = `${this.baseURL}/api/dashboard/front-desk/special-offers/${id}/image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
      },
    });

    return this.handleResponse<SpecialOfferResponse>(response);
  }

  // ==================== STAYS APIs ====================

  /**
   * Get Stays
   * GET /api/dashboard/front-desk/stays
   */
  async getStays(
    page: number = 0,
    size: number = 10
  ): Promise<PageStayDetailsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.authenticatedFetch<PageStayDetailsResponse>(
      `${this.baseURL}/api/dashboard/front-desk/stays?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Create Stay
   * POST /api/dashboard/front-desk/stays
   */
  async createStay(stay: CreateStayRequest): Promise<StayDetailsResponse> {
    return this.authenticatedFetch<StayDetailsResponse>(
      `${this.baseURL}/api/dashboard/front-desk/stays`,
      {
        method: 'POST',
        body: JSON.stringify(stay),
      }
    );
  }

  /**
   * Check-in Stay
   * PUT /api/dashboard/front-desk/stays/{stayId}/checkin
   */
  async checkInStay(stayId: number): Promise<StayDetailsResponse> {
    return this.authenticatedFetch<StayDetailsResponse>(
      `${this.baseURL}/api/dashboard/front-desk/stays/${stayId}/checkin`,
      {
        method: 'PUT',
      }
    );
  }

  /**
   * Check-out Stay
   * PUT /api/dashboard/front-desk/stays/{stayId}/checkout
   */
  async checkOutStay(stayId: number): Promise<StayDetailsResponse> {
    return this.authenticatedFetch<StayDetailsResponse>(
      `${this.baseURL}/api/dashboard/front-desk/stays/${stayId}/checkout`,
      {
        method: 'PUT',
      }
    );
  }

  /**
   * Get Stay Special Orders
   * GET /api/dashboard/front-desk/stays/{stayId}/special-orders
   */
  async getStaySpecialOrders(stayId: number): Promise<SpecialOrderResponse[]> {
    return this.authenticatedFetch<SpecialOrderResponse[]>(
      `${this.baseURL}/api/dashboard/front-desk/stays/${stayId}/special-orders`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Create Stay Special Order
   * POST /api/dashboard/front-desk/stays/{stayId}/special-orders
   */
  async createStaySpecialOrder(stayId: number, order: CreateSpecialOrderRequest): Promise<SpecialOrderResponse> {
    return this.authenticatedFetch<SpecialOrderResponse>(
      `${this.baseURL}/api/dashboard/front-desk/stays/${stayId}/special-orders`,
      {
        method: 'POST',
        body: JSON.stringify(order),
      }
    );
  }

  // ==================== MANAGER APIs ====================

  /**
   * Get Users
   * GET /api/dashboard/manager/users
   */
  async getUsers(
    page: number = 0,
    size: number = 10
  ): Promise<PageUserResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.authenticatedFetch<PageUserResponse>(
      `${this.baseURL}/api/dashboard/manager/users?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Create User
   * POST /api/dashboard/manager/users
   */
  async createUser(user: CreateUserRequest): Promise<UserResponse> {
    return this.authenticatedFetch<UserResponse>(
      `${this.baseURL}/api/dashboard/manager/users`,
      {
        method: 'POST',
        body: JSON.stringify(user),
      }
    );
  }

  /**
   * Update User
   * PUT /api/dashboard/manager/users/{id}
   */
  async updateUser(id: number, user: UpdateUserRequest): Promise<UserResponse> {
    return this.authenticatedFetch<UserResponse>(
      `${this.baseURL}/api/dashboard/manager/users/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(user),
      }
    );
  }

  /**
   * Delete User
   * DELETE /api/dashboard/manager/users/{id}
   */
  async deleteUser(id: number): Promise<void> {
    return this.authenticatedFetch<void>(
      `${this.baseURL}/api/dashboard/manager/users/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Get VIP Guests
   * GET /api/dashboard/manager/vips
   */
  async getVips(
    page: number = 0,
    size: number = 10
  ): Promise<PageVipResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.authenticatedFetch<PageVipResponse>(
      `${this.baseURL}/api/dashboard/manager/vips?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get Special Orders
   * GET /api/dashboard/manager/special-orders
   */
  async getManagerSpecialOrders(page: number = 0, size: number = 50): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/manager/special-orders?page=${page}&size=${size}`,
      {
        method: 'GET',
      }
    );
  }

  // ==================== STATS AND PENDING ORDERS APIs ====================
  async updateRoomServiceOrderStatus(orderId: number, status: string): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/room-service/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  }

  /**
   * Get Restaurant Stats
   * GET /api/dashboard/restaurant/stats
   */
  async getRestaurantStats(): Promise<DashboardStatsResponse> {
    return this.authenticatedFetch<DashboardStatsResponse>(
      `${this.baseURL}/api/dashboard/restaurant/stats`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get Restaurant Pending Orders
   * GET /api/dashboard/restaurant/pending-orders
   */
  async getRestaurantPendingOrders(): Promise<PendingOrdersResponse[]> {
    return this.authenticatedFetch<PendingOrdersResponse[]>(
      `${this.baseURL}/api/dashboard/restaurant/pending-orders`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Update Restaurant Order Status
   * PATCH /api/dashboard/restaurant/orders/{orderId}/status
   */
  async updateRestaurantOrderStatus(orderId: number, status: string): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/restaurant/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  }

  /**
   * Get Cafe Stats
   * GET /api/dashboard/cafe/stats
   */
  async getCafeStats(): Promise<DashboardStatsResponse> {
    return this.authenticatedFetch<DashboardStatsResponse>(
      `${this.baseURL}/api/dashboard/cafe/stats`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get all menu items from room service endpoint
   */
  async getAllMenuItems(): Promise<any[]> {
    const allItems: any[] = [];

    // Get room service menu
    try {
      const params = new URLSearchParams({ page: '0', size: '100' });
      const roomServiceMenu = await this.authenticatedFetch<any>(
        `${this.baseURL}/api/dashboard/room-service/menu?${params.toString()}`,
        { method: 'GET' }
      );
      const roomServiceItems = Array.isArray(roomServiceMenu?.content) ? roomServiceMenu.content :
        Array.isArray(roomServiceMenu) ? roomServiceMenu : [];
      roomServiceItems.forEach((item: any) => {
        allItems.push({
          id: item.id,
          name: item.name || '',
          description: item.description || '',
          price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
          category: 'ROOM_SERVICE',
          available: item.available !== false,
          imageUrl: item.imageUrl || null,
          source: 'room-service',
        });
      });
    } catch (error) {
      // Ignore error
    }

    return allItems;
  }

  /**
   * Create menu item routed to the correct endpoint based on category
   * FOOD → /api/dashboard/restaurant/menu
   * DRINK → /api/dashboard/cafe/menu
   * ROOM_SERVICE → /api/dashboard/room-service/menu
   */
  async createMenuItemByCategory(item: CreateMenuItemRequest, category: string): Promise<MenuItemResponse> {
    switch (category) {
      case 'FOOD':
        return this.createRestaurantMenuItem(item);
      case 'DRINK':
        return this.createCafeMenuItem(item);
      case 'ROOM_SERVICE':
        return this.createRoomServiceMenuItem(item);
      default:
        return this.createRestaurantMenuItem(item);
    }
  }

  // ==================== ROOM CATEGORIES APIs ====================

  /**
   * Get Room Categories
   * GET /api/dashboard/front-desk/room-categories
   */
  async getRoomCategories(
    page: number = 0,
    size: number = 50
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/front-desk/room-categories?${params.toString()}`,
      { method: 'GET' }
    );
  }

  /**
   * Create Room Category
   * POST /api/dashboard/front-desk/room-categories
   */
  async createRoomCategory(category: CreateRoomCategoryRequest): Promise<RoomCategoryResponse> {
    return this.authenticatedFetch<RoomCategoryResponse>(
      `${this.baseURL}/api/dashboard/front-desk/room-categories`,
      {
        method: 'POST',
        body: JSON.stringify(category),
      }
    );
  }

  /**
   * Update Room Category
   * PUT /api/dashboard/front-desk/room-categories/{id}
   */
  async updateRoomCategory(id: number, category: UpdateRoomCategoryRequest): Promise<RoomCategoryResponse> {
    return this.authenticatedFetch<RoomCategoryResponse>(
      `${this.baseURL}/api/dashboard/front-desk/room-categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(category),
      }
    );
  }

  /**
   * Delete Room Category
   * DELETE /api/dashboard/front-desk/room-categories/{id}
   */
  async deleteRoomCategory(id: number): Promise<void> {
    return this.authenticatedFetch<void>(
      `${this.baseURL}/api/dashboard/front-desk/room-categories/${id}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Upload Room Category Image
   * POST /api/dashboard/front-desk/room-categories/{id}/image
   */
  async uploadRoomCategoryImage(id: number, file: File): Promise<RoomCategoryResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    // Remove Content-Type to let browser set it with boundary for multipart
    delete headers['Content-Type'];

    const url = `${this.baseURL}/api/dashboard/front-desk/room-categories/${id}/image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
      },
    });

    return this.handleResponse<RoomCategoryResponse>(response);
  }

  /**
   * Set Daily Rates for Room Category
   * POST /api/dashboard/front-desk/room-categories/{id}/rates
   */
  async setRoomCategoryRates(id: number, rates: SetRatesRequest): Promise<void> {
    return this.authenticatedFetch<void>(
      `${this.baseURL}/api/dashboard/front-desk/room-categories/${id}/rates`,
      {
        method: 'POST',
        body: JSON.stringify(rates),
      }
    );
  }

  /**
   * Get Daily Rates for Room Category
   * GET /api/dashboard/front-desk/room-categories/{id}/rates
   */
  async getRoomCategoryRates(id: number, from: string, to: string): Promise<DailyRateResponse[]> {
    return this.authenticatedFetch<DailyRateResponse[]>(
      `${this.baseURL}/api/dashboard/front-desk/room-categories/${id}/rates?from=${from}&to=${to}`,
      { method: 'GET' }
    );
  }

  // ==================== RESERVATION REQUESTS APIs ====================

  /**
   * Get Pending Reservation Requests (Landing Page Requests)
   * GET /api/dashboard/front-desk/reservation-requests
   */
  async getPendingReservationRequests(
    page: number = 0,
    size: number = 50
  ): Promise<PagedModelReservationRequestResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.authenticatedFetch<PagedModelReservationRequestResponse>(
      `${this.baseURL}/api/dashboard/front-desk/reservation-requests?${params.toString()}`,
      { method: 'GET' }
    );
  }

  /**
   * Approve Reservation Request
   * POST /api/dashboard/front-desk/reservation-requests/{id}/approve
   */
  async approveReservationRequest(id: number, request: ApproveReservationRequest): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/front-desk/reservation-requests/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Reject Reservation Request
   * POST /api/dashboard/front-desk/reservation-requests/{id}/reject
   */
  async rejectReservationRequest(id: number, request: RejectReservationRequest): Promise<any> {
    return this.authenticatedFetch<any>(
      `${this.baseURL}/api/dashboard/front-desk/reservation-requests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }
}

// Export singleton instance
export const apiService = new APIService(API_BASE_URL);

// Export types for use in components
export type {
  LoginRequest,
  LoginResponse,
  CreateSpecialOfferRequest,
  SpecialOfferResponse,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  PatchMenuItemRequest,
  MenuItemResponse,
  CreateOrderRequest,
  OrderItemRequest,
  OrderItemDetailResponse,
  OrderResponse,
  UpdateOrderStatusRequest,
  RoomResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
  PatchRoomRequest,
  RoomCategoryResponse,
  CreateRoomCategoryRequest,
  UpdateRoomCategoryRequest,
  DailyRateResponse,
  SetRatesRequest,
  StayDetailsResponse,
  CreateStayRequest,
  CreateSpecialOrderRequest,
  SpecialOrderResponse,
  PageStayDetailsResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  VipResponse,
  PageVipResponse,
  PageUserResponse,
  ReservationRequestResponse,
  ApproveReservationRequest,
  RejectReservationRequest,
  DashboardStatsResponse,
  PendingOrdersResponse,
  PagedModelRoomResponse,
  PagedModelStayDetailsResponse,
  PagedModelReservationRequestResponse,
  PagedModelSpecialOrderResponse,
};
