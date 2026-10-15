import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Field, TimeSlot } from '../models/field.model';

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getOwnerFields(): Observable<Field[]> {
    return this.http.get<Field[]>(`${this.apiUrl}/owner/fields`);
  }

  createField(fieldData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fields`, fieldData, { responseType: 'text' });
  }

  deleteField(fieldId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/fields/${fieldId}`);
  }

  getSlots(fieldId: number, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/fields/${fieldId}/slots?date=${date}`);
  }

  createSlot(fieldId: number, slotData: Partial<TimeSlot>): Observable<TimeSlot> {
    return this.http.post<TimeSlot>(`${this.apiUrl}/fields/${fieldId}/slots`, slotData);
  }

  deleteSlot(fieldId: number, slotId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/fields/${fieldId}/slots/${slotId}`);
  }

  updateField(fieldId: number, fieldData: any): Observable<Field> {
    if (fieldData.photo) {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      Object.keys(fieldData).forEach(key => {
        if (fieldData[key] !== null && fieldData[key] !== undefined) {
          formData.append(key, fieldData[key]);
        }
      });
      return this.http.post<Field>(`${this.apiUrl}/fields/${fieldId}`, formData);
    }
    return this.http.put<Field>(`${this.apiUrl}/fields/${fieldId}`, fieldData);
  }

  updateSlot(fieldId: number, slotId: number, data: Partial<TimeSlot>): Observable<TimeSlot> {
    return this.http.put<TimeSlot>(`${this.apiUrl}/fields/${fieldId}/slots/${slotId}`, data);
  }

  bulkCreateSlots(fieldId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fields/${fieldId}/slots/bulk`, data);
  }

  createManualReservation(data: { time_slot_id: number; player_name: string; player_phone: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/owner/reservations/manual`, data);
  }
}
