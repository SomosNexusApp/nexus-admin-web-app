import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';
import { AdminOferta, PagedResult } from '../admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminOfertasService {
  private apiUrl = `${environment.apiUrl}/api/admin/ofertas`;

  constructor(private http: HttpClient) {}

  buscar(estado?: string, page: number = 0, size: number = 20): Observable<PagedResult<AdminOferta>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (estado) params = params.set('estado', estado);
    return this.http.get<PagedResult<AdminOferta>>(this.apiUrl, { params });
  }

  aprobar(id: number): Observable<AdminOferta> {
    return this.http.patch<AdminOferta>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazar(id: number, motivo: string): Observable<AdminOferta> {
    return this.http.patch<AdminOferta>(`${this.apiUrl}/${id}/rechazar`, { motivo });
  }

  toggleDestacada(id: number): Observable<AdminOferta> {
    return this.http.patch<AdminOferta>(`${this.apiUrl}/${id}/destacar`, {});
  }

  crearFlash(req: any): Observable<AdminOferta> {
    return this.http.post<AdminOferta>(`${this.apiUrl}/flash`, req);
  }
}
