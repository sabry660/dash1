import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';

export interface ReservationRequest {
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
  status: string; // PENDING, APPROVED, REJECTED
  notes: string;
  rejectionReason: string;
  processedByUserId: number;
  processedAt: string;
  createdAt: string;
}

export interface StayDetailsResponse {
  stayId: number;
  expectedCheckInDate: string;
  expectedCheckOutDate: string;
  status: 'RESERVED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'NO_SHOW';
  guestName: string;
  guestPhone: string;
  email: string;
  roomId: number;
  roomNumber: string;
  numAdults: number;
  numKids: number;
  totalCharge: number;
}

export interface ApproveRequest {
  roomId: number;
}

export interface RejectRequest {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationRequestService {
  // 1. Base for Reservation Request endpoints
  private baseUrl = `${environment.apiUrl}/api/dashboard/front-desk/reservation-requests`;
  
  // 2. Base for Stays endpoints (CORRECTION HERE)
  private staysUrl = `${environment.apiUrl}/api/dashboard/front-desk/stays`;

  constructor(private http: HttpClient) {}

  getPendingRequests(page: number = 0, size: number = 20): Observable<{ content: ReservationRequest[], page: any }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<{ content: ReservationRequest[], page: any }>(this.baseUrl, { params });
  }

  approveRequest(id: number, roomId: number): Observable<ReservationRequest> {
    return this.http.post<ReservationRequest>(`${this.baseUrl}/${id}/approve`, { roomId });
  }

  rejectRequest(id: number, reason: string): Observable<ReservationRequest> {
    return this.http.post<ReservationRequest>(`${this.baseUrl}/${id}/reject`, { reason });
  }

  getStays(statuses: string[], page: number, size: number): Observable<{ content: StayDetailsResponse[] }> {
    let params = `page=${page}&size=${size}`;
    if (statuses && statuses.length > 0) {
      params += `&${statuses.map(s => `status=${s}`).join('&')}`;
    }
    
    // FIX: Use 'staysUrl' instead of 'baseUrl' to prevent path concatenation
    return this.http.get<{ content: StayDetailsResponse[] }>(
      `${this.staysUrl}?${params}`
    );
  }
}