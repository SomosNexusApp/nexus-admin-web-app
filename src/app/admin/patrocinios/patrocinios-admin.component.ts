import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Patrocinio {
  id: number;
  tipoItem: string;
  itemId: number;
  itemTitulo: string;
  itemImagen?: string;
  estado: string;
  monto?: number;
  diasPatrocinio?: number;
  fecha: string;
  actor?: { id: number; user: string; nombre?: string; avatar?: string; };
  descripcion?: string;
}

@Component({
  selector: 'app-patrocinios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patrocinios-admin.component.html',
  styleUrls: ['./patrocinios-admin.component.css'],
})
export class PatrociniosAdminComponent implements OnInit {
  private http = inject(HttpClient);

  patrocinios = signal<Patrocinio[]>([]);
  cargando = signal(false);
  filtroEstado = signal<string>('SOLICITUD_USUARIO');

  // Para aprobar
  montoAprobacion: Record<number, number> = {};
  aprobando = signal<number | null>(null);
  cancelando = signal<number | null>(null);

  // Para activar directamente
  activacionDirecta = signal<{tipoItem: string; itemId: number; dias: number} | null>(null);

  ngOnInit() {
    this.cargarPatrocinios();
  }

  cargarPatrocinios() {
    this.cargando.set(true);
    this.http.get<Patrocinio[]>(`${environment.apiUrl}/api/patrocinios/admin/pendientes`).subscribe({
      next: (res) => { this.patrocinios.set(res || []); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  get filtrados(): Patrocinio[] {
    const f = this.filtroEstado();
    if (f === 'TODOS') return this.patrocinios();
    return this.patrocinios().filter(p => p.estado === f);
  }

  aprobar(id: number) {
    const monto = this.montoAprobacion[id] ?? null;
    this.aprobando.set(id);
    this.http.post<any>(`${environment.apiUrl}/api/patrocinios/admin/${id}/aprobar`, { monto }).subscribe({
      next: () => { this.aprobando.set(null); this.cargarPatrocinios(); },
      error: () => this.aprobando.set(null)
    });
  }

  cancelar(id: number) {
    if (!confirm('¿Cancelar esta solicitud de patrocinio?')) return;
    this.cancelando.set(id);
    this.http.post<any>(`${environment.apiUrl}/api/patrocinios/admin/${id}/cancelar`, {}).subscribe({
      next: () => { this.cancelando.set(null); this.cargarPatrocinios(); },
      error: () => this.cancelando.set(null)
    });
  }

  activarDirecto(tipoItem: string, itemId: number, dias: number) {
    this.http.post<any>(`${environment.apiUrl}/api/patrocinios/admin/activar`, { tipoItem, itemId, diasPatrocinio: dias }).subscribe({
      next: () => alert('✓ Item patrocinado correctamente'),
      error: (e) => alert('Error: ' + (e?.error?.error || e.message))
    });
  }

  desactivarDirecto(tipoItem: string, itemId: number) {
    if (!confirm(`¿Quitar el patrocinio de este ${tipoItem.toLowerCase()}?`)) return;
    this.http.post<any>(`${environment.apiUrl}/api/patrocinios/admin/desactivar`, { tipoItem, itemId }).subscribe({
      next: () => { alert('✓ Patrocinio eliminado'); this.cargarPatrocinios(); },
      error: (e) => alert('Error: ' + (e?.error?.error || e.message))
    });
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      SOLICITUD_USUARIO: 'En revisión',
      APROBADO_PENDIENTE_PAGO: 'Aprobado · Pago pendiente',
      PENDIENTE_PAGO: 'Procesando pago',
      ACTIVE: 'Activo',
      CANCELLED: 'Cancelado',
      RECHAZADO: 'No aprobado',
      EXPIRED: 'Expirado'
    };
    return map[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    if (estado === 'ACTIVE') return 'badge-active';
    if (estado === 'APROBADO_PENDIENTE_PAGO' || estado === 'PENDIENTE_PAGO') return 'badge-approved';
    if (estado === 'SOLICITUD_USUARIO') return 'badge-pending';
    if (estado === 'CANCELLED' || estado === 'RECHAZADO') return 'badge-cancelled';
    return 'badge-neutral';
  }

  estadosFiltros = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'SOLICITUD_USUARIO', label: 'En revisión' },
    { value: 'APROBADO_PENDIENTE_PAGO', label: 'Aprobados' },
    { value: 'ACTIVE', label: 'Activos' },
    { value: 'CANCELLED', label: 'Cancelados' },
  ];
}
