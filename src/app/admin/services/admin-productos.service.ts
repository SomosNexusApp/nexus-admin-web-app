import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminProducto, PagedResult } from '../admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminProductosService {
  private apiUrl = `${environment.apiUrl}/api/admin/productos`;

  constructor(private http: HttpClient) {}

  buscar(filtros: any, page: number = 0, size: number = 20): Observable<PagedResult<AdminProducto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filtros.q) params = params.set('q', filtros.q);
    if (filtros.categoriaId) params = params.set('categoriaId', filtros.categoriaId.toString());
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.vendedorId) params = params.set('vendedorId', filtros.vendedorId.toString());
    if (filtros.precioMin) params = params.set('precioMin', filtros.precioMin.toString());
    if (filtros.precioMax) params = params.set('precioMax', filtros.precioMax.toString());
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);

    return this.http.get<PagedResult<AdminProducto>>(this.apiUrl, { params });
  }

  editar(id: number, body: any): Observable<AdminProducto> {
    return this.http.patch<AdminProducto>(`${this.apiUrl}/${id}`, body);
  }

  pausar(id: number, motivo: string, duracionHoras: number): Observable<AdminProducto> {
    return this.http.patch<AdminProducto>(`${this.apiUrl}/${id}/pausar`, { motivo, duracionHoras });
  }

  reactivar(id: number): Observable<AdminProducto> {
    return this.http.patch<AdminProducto>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminar(id: number, motivo: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { body: { motivo } });
  }

  toggleDestacado(id: number): Observable<AdminProducto> {
    return this.http.patch<AdminProducto>(`${this.apiUrl}/${id}/destacar`, {});
  }
}
