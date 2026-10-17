import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Field, TimeSlot } from '../models/field.model';

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private parseCleanJson(response: any): any {
    if (typeof response !== 'string') {
      return response;
    }
    const startObj = response.indexOf('{');
    const startArr = response.indexOf('[');
    const start = (startObj !== -1 && startArr !== -1)
      ? Math.min(startObj, startArr)
      : (startObj !== -1 ? startObj : startArr);

    if (start !== -1) {
      try {
        return JSON.parse(response.substring(start));
      } catch {
        return response;
      }
    }
    return response;
  }

  getOwnerFields(): Observable<Field[]> {
    return this.http.get<Field[]>(`${this.apiUrl}/owner/fields`);
  }

  getField(fieldId: number): Observable<Field> {
    return this.http.get<any>(`${this.apiUrl}/fields/${fieldId}`).pipe(
      map(res => res?.field || res)
    );
  }

  createField(fieldData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fields`, fieldData, { responseType: 'text' }).pipe(
      map(res => this.parseCleanJson(res))
    );
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
    const hasPhotos = fieldData.photo || (fieldData.photos && fieldData.photos.length > 0);
    if (hasPhotos) {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      Object.keys(fieldData).forEach(key => {
        if (key === 'photos' && Array.isArray(fieldData.photos)) {
          fieldData.photos.forEach((file: File) => {
            formData.append('photos[]', file);
          });
        } else if (key !== 'photos' && fieldData[key] !== null && fieldData[key] !== undefined) {
          formData.append(key, fieldData[key]);
        }
      });
      return this.http.post(`${this.apiUrl}/fields/${fieldId}`, formData, { responseType: 'text' }).pipe(
        map(res => this.parseCleanJson(res) as Field)
      );
    }
    return this.http.put<Field>(`${this.apiUrl}/fields/${fieldId}`, fieldData);
  }

  deleteFieldImage(fieldId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/fields/${fieldId}/images/${imageId}`);
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
