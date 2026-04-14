import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminSeguridadService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/api/admin/seguridad`;

  get2FASetup(): Observable<TwoFactorSetup> {
    return this.http.get<TwoFactorSetup>(`${this.API_URL}/2fa/setup`);
  }

  activar2FA(code: string): Observable<any> {
    return this.http.post(`${this.API_URL}/2fa/activar`, { code });
  }

  desactivar2FA(code: string): Observable<any> {
    return this.http.post(`${this.API_URL}/2fa/desactivar`, { code });
  }
}
