import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OwnerSettings, AccountingReport } from '../models/owner-settings.model';

@Injectable({
  providedIn: 'root'
})
export class OwnerSettingsService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la configuration complète du gérant
   */
  getSettings(): Observable<{ settings: OwnerSettings; business_name: string; commission_rate: number }> {
    return this.http.get<{ settings: OwnerSettings; business_name: string; commission_rate: number }>(
      `${this.apiUrl}/owner/settings`
    );
  }

  /**
   * Met à jour les paramètres de configuration du gérant
   */
  updateSettings(settings: OwnerSettings): Observable<{ message: string; settings: OwnerSettings }> {
    return this.http.put<{ message: string; settings: OwnerSettings }>(
      `${this.apiUrl}/owner/settings`,
      { settings }
    );
  }

  /**
   * Récupère les données du rapport comptable pour une période donnée
   */
  getAccountingReport(year?: number, month?: number | string, fieldId?: number): Observable<AccountingReport> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month && month !== 'all') params = params.set('month', month.toString());
    if (fieldId) params = params.set('field_id', fieldId.toString());

    return this.http.get<AccountingReport>(`${this.apiUrl}/owner/reports/accounting`, { params });
  }

  /**
   * Télécharge l'export CSV du relevé comptable
   */
  exportAccountingCsv(year?: number, month?: number | string): void {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month && month !== 'all') params = params.set('month', month.toString());

    this.http.get(`${this.apiUrl}/owner/reports/export-csv`, {
      params,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const monthPart = month && month !== 'all' ? `_${month}` : '';
        a.download = `releve_comptable_${year || new Date().getFullYear()}${monthPart}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement du fichier CSV', err);
      }
    });
  }
}
