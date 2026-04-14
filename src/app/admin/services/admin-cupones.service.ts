import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminCupon, CuponUso, CuponStats, PagedResult } from '../admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminCuponesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/admin/cupones`;

  buscar(activo?: boolean, caducado?: boolean, page = 0, size = 20): Observable<PagedResult<AdminCupon>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (activo !== undefined) url += `&activo=${activo}`;
    if (caducado !== undefined) url += `&caducado=${caducado}`;
    return this.http.get<PagedResult<AdminCupon>>(url);
  }

  getStats(): Observable<CuponStats> {
    return this.http.get<CuponStats>(`${this.apiUrl}/stats`);
  }

  crear(cupon: any): Observable<AdminCupon> {
    return this.http.post<AdminCupon>(this.apiUrl, cupon);
  }

  editar(id: number, cupon: any): Observable<AdminCupon> {
    return this.http.patch<AdminCupon>(`${this.apiUrl}/${id}`, cupon);
  }

  desactivar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  reactivar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUsos(id: number, page = 0, size = 20): Observable<PagedResult<CuponUso>> {
    return this.http.get<PagedResult<CuponUso>>(`${this.apiUrl}/${id}/usos?page=${page}&size=${size}`);
  }

  checkCodigo(codigo: string): Observable<{ disponible: boolean }> {
    return this.http.get<{ disponible: boolean }>(`${this.apiUrl}/check?codigo=${codigo}`);
  }
}
