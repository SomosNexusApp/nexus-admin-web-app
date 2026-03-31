import { Component, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/enviroment';
import { interval, Subscription } from 'rxjs';
import { AdminService } from '../admin.service';

interface SesionRow {
  id: number;
  sessionToken: string;
  usuarioId?: number;
  humanTakeover: boolean;
  status: string;
  insistenciaAgente: number;
  actualizadoEn: string;
  numMensajes: number;
}

interface MsgRow {
  id: number;
  rol: string;
  contenido: string;
  tipoContenido?: string;
  referenciaId?: number;
  referencia?: { id: number; tipo: string; titulo: string; precio: number; imagen?: string };
  creadoEn: string;
}

@Component({
  selector: 'app-soporte-chat-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './soporte-chat-admin.component.html',
  styleUrls: ['./soporte-chat-admin.component.css'],
})
export class SoporteChatAdminComponent implements OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private adminService = inject(AdminService);
  private base = `${environment.apiUrl}/api/admin/soporte`;

  sesiones = signal<SesionRow[]>([]);
  seleccion = signal<SesionRow | null>(null);
  mensajes = signal<MsgRow[]>([]);
  comprasUsuario = signal<any[]>([]);
  refundReason = '';
  replyText = '';
  loading = signal(false);

  // Search items
  showPicker = signal<'OFF' | 'PRODUCTO' | 'OFERTA' | 'VEHICULO'>('OFF');
  searchQuery = '';
  items = signal<any[]>([]);

  private pollSub: Subscription | null = null;

  constructor() {
    this.refrescarSesiones();
    this.pollSub = interval(5000).subscribe(() => {
      this.refrescarSesiones();
      const s = this.seleccion();
      if (s) this.cargarMensajes(s.id, false);
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  refrescarSesiones(): void {
    this.http.get<SesionRow[]>(`${this.base}/sessions`).subscribe((list) => {
      this.sesiones.set(list);
      this.cdr.markForCheck();
    });
  }

  seleccionar(s: SesionRow): void {
    this.seleccion.set(s);
    this.comprasUsuario.set([]);
    this.refundReason = '';
    this.cargarMensajes(s.id, true);
    this.cargarComprasSesion(s.id);
  }

  cargarMensajes(sessionId: number, spin: boolean): void {
    if (spin) this.loading.set(true);
    this.http.get<MsgRow[]>(`${this.base}/sessions/${sessionId}/messages`).subscribe({
      next: (m) => {
        const changed = this.mensajes().length !== m.length;
        this.mensajes.set(m);
        if (spin) this.loading.set(false);
        if (changed) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        if (spin) this.loading.set(false);
      },
    });
  }

  scrollToBottom(): void {
    const el = document.querySelector('#scaMessages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  takeover(): void {
    const s = this.seleccion();
    if (!s) return;
    this.http.post(`${this.base}/sessions/${s.id}/takeover`, {}).subscribe(() => {
      this.cargarMensajes(s.id, true);
      this.refrescarSesiones();
    });
  }

  cargarComprasSesion(sessionId: number): void {
    const s = this.seleccion();
    if (!s?.usuarioId) {
      this.comprasUsuario.set([]);
      this.cdr.markForCheck();
      return;
    }
    this.adminService.getComprasSoporteSession(sessionId).subscribe({
      next: (rows) => {
        this.comprasUsuario.set(rows || []);
        this.cdr.markForCheck();
      },
      error: () => {
        this.comprasUsuario.set([]);
        this.cdr.markForCheck();
      },
    });
  }

  reembolsarDesdeChat(compraId: number): void {
    const s = this.seleccion();
    if (!s) return;
    if (!confirm(`¿Reembolsar la compra #${compraId} desde soporte?`)) return;
    const motivo = this.refundReason?.trim() || 'Incidencia gestionada desde chat de soporte';
    this.adminService.reembolsarCompraDesdeSoporte(s.id, compraId, motivo).subscribe({
      next: () => {
        this.refundReason = '';
        this.cargarMensajes(s.id, false);
        this.cargarComprasSesion(s.id);
      },
    });
  }

  resumeAi(): void {
    const s = this.seleccion();
    if (!s) return;
    this.http.post(`${this.base}/sessions/${s.id}/resume-ai`, {}).subscribe(() => {
      this.cargarMensajes(s.id, true);
      this.refrescarSesiones();
    });
  }

  closeChat(): void {
    const s = this.seleccion();
    if (!s) return;
    if (!confirm('¿Cerrar esta conversación definitivamente?')) return;
    this.http.post(`${this.base}/sessions/${s.id}/close`, {}).subscribe(() => {
      this.cargarMensajes(s.id, true);
      this.refrescarSesiones();
    });
  }

  sendSurvey(): void {
    const s = this.seleccion();
    if (!s) return;
    this.http.post(`${this.base}/sessions/${s.id}/request-survey`, {}).subscribe(() => {
      this.cargarMensajes(s.id, true);
      this.refrescarSesiones();
    });
  }

  enviar(): void {
    const t = this.replyText.trim();
    const s = this.seleccion();
    if (!t || !s) return;
    this.replyText = '';
    this.http.post(`${this.base}/sessions/${s.id}/reply`, { text: t }).subscribe(() => {
      this.cargarMensajes(s.id, false);
      this.refrescarSesiones();
    });
  }

  // Picker logic
  openPicker(type: 'PRODUCTO' | 'OFERTA' | 'VEHICULO'): void {
    this.showPicker.set(type);
    this.searchQuery = '';
    this.items.set([]);
    this.buscarItems();
  }

  buscarItems(): void {
    const type = this.showPicker();
    if (type === 'OFF') return;
    const s = this.seleccion();
    if (!s) return;
    const url = `${this.base}/sessions/${s.id}/referencias?tipo=${type}&q=${encodeURIComponent(this.searchQuery || '')}`;
    this.http.get<any[]>(url).subscribe(res => {
      this.items.set(res || []);
    });
  }

  sendItem(item: any): void {
    const s = this.seleccion();
    if (!s) return;
    const type = this.showPicker();
    const text = `${item.titulo}`;

    this.http.post(`${this.base}/sessions/${s.id}/reply`, { 
      text: text,
      tipoContenido: type,
      referenciaId: item.id
    }).subscribe(() => {
      this.showPicker.set('OFF');
      this.cargarMensajes(s.id, false);
    });
  }
}
