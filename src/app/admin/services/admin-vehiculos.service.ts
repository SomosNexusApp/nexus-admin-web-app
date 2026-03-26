import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';
import { AdminVehiculo, PagedResult } from '../admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminVehiculosService {
  private apiUrl = `${environment.apiUrl}/api/admin/vehiculos`;

  constructor(private http: HttpClient) {}

  buscar(filtros: any, page: number = 0, size: number = 20): Observable<PagedResult<AdminVehiculo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filtros.q) params = params.set('q', filtros.q);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.precioMin) params = params.set('precioMin', filtros.precioMin.toString());
    if (filtros.precioMax) params = params.set('precioMax', filtros.precioMax.toString());
    if (filtros.anioMin) params = params.set('anioMin', filtros.anioMin.toString());
    if (filtros.kmMax) params = params.set('kmMax', filtros.kmMax.toString());

    return this.http.get<PagedResult<AdminVehiculo>>(this.apiUrl, { params });
  }

  pausar(id: number, motivo: string): Observable<AdminVehiculo> {
    return this.http.patch<AdminVehiculo>(`${this.apiUrl}/${id}/pausar`, { motivo });
  }

  reactivar(id: number): Observable<AdminVehiculo> {
    return this.http.patch<AdminVehiculo>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminar(id: number, motivo: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { body: { motivo } });
  }
}
