import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOwnerReservations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/owner/reservations`);
  }

  cancelReservation(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/reservations/${id}/cancel`, {});
  }
}

