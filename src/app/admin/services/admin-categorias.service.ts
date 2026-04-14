import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminCategoria } from '../admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminCategoriasService {
  private apiUrl = `${environment.apiUrl}/api/admin/categorias`;

  constructor(private http: HttpClient) {}

  getArbol(): Observable<AdminCategoria[]> {
    return this.http.get<AdminCategoria[]>(this.apiUrl);
  }

  checkSlug(slug: string): Observable<{ exists: boolean }> {
    const params = new HttpParams().set('slug', slug);
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-slug`, { params });
  }

  crear(categoria: any): Observable<AdminCategoria> {
    return this.http.post<AdminCategoria>(this.apiUrl, categoria);
  }

  editar(id: number, categoria: any): Observable<AdminCategoria> {
    return this.http.patch<AdminCategoria>(`${this.apiUrl}/${id}`, categoria);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleActiva(id: number): Observable<AdminCategoria> {
    return this.http.patch<AdminCategoria>(`${this.apiUrl}/${id}/toggle`, {});
  }

  reordenar(items: { id: number; nuevoOrden: number; padreId?: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reordenar`, items);
  }
}
