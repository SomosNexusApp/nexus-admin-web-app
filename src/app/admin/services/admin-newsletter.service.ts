import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';

export interface NewsletterStats {
  total: number;
  activos: number;
  pendientes: number;
  bajas: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNewsletterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/admin/newsletter`;

  getStats(): Observable<NewsletterStats> {
    return this.http.get<NewsletterStats>(`${this.apiUrl}/stats`);
  }

  enviarPrueba(email: string, asunto: string, contenido: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/prueba`, { email, asunto, contenido });
  }

  enviarATodos(asunto: string, contenido: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar`, { asunto, contenido });
  }

  getConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config`);
  }

  saveConfig(config: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/config`, config);
  }

  getWeeklyPreview(): Observable<{ html: string }> {
    return this.http.get<{ html: string }>(`${this.apiUrl}/preview-weekly`);
  }

  triggerWeekly(): Observable<any> {
    return this.http.post(`${this.apiUrl}/trigger-weekly`, {});
  }
}
