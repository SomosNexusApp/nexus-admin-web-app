import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AuditLogEntry, PagedResult } from '../admin.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="admin-page">
  <div class="page-header">
    <div>
      <h1 class="page-title"><i class="fa-solid fa-scroll"></i> Audit Log</h1>
      <p class="page-subtitle">{{ result()?.totalElements || 0 }} entradas registradas</p>
    </div>
    <button class="export-btn" (click)="exportCsv()">
      <i class="fa-solid fa-download"></i> Exportar CSV
    </button>
  </div>

  <div class="filters-bar">
    <input [(ngModel)]="adminFilter" (ngModelChange)="page=0; load()" placeholder="Filtrar por admin..." class="filter-input">
    <input [(ngModel)]="tipoFilter" (ngModelChange)="page=0; load()" placeholder="Tipo de acción..." class="filter-input">
    <input [(ngModel)]="entidadFilter" (ngModelChange)="page=0; load()" placeholder="Entidad (USUARIO, PRODUCTO...)" class="filter-input">
    <input type="date" [(ngModel)]="fechaDesde" (ngModelChange)="page=0; load()" class="filter-input" title="Desde">
    <input type="date" [(ngModel)]="fechaHasta" (ngModelChange)="page=0; load()" class="filter-input" title="Hasta">
  </div>

  <div class="admin-card">
    <div class="table-wrap">
      @if (loading()) {
        <div class="loading-overlay"><i class="fa-solid fa-spinner fa-spin"></i></div>
      }
      <table class="admin-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin</th>
            <th>Acción</th>
            <th>Entidad</th>
            <th>ID</th>
            <th>Detalle</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          @for (e of result()?.content || []; track e.id) {
            <tr>
              <td class="ts-cell">{{ formatDate(e.timestamp) }}</td>
              <td class="admin-cell">{{ e.adminUser }}</td>
              <td><span class="accion-chip">{{ e.accion }}</span></td>
              <td class="dim-cell">{{ e.entidadTipo }}</td>
              <td class="dim-cell">{{ e.entidadId || '—' }}</td>
              <td class="detalle-cell">{{ e.detalle || '—' }}</td>
              <td class="ip-cell">{{ e.ip }}</td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="empty-row">Sin entradas en el Audit Log</td></tr>
          }
        </tbody>
      </table>
    </div>
    @if (result() && result()!.totalPages > 1) {
      <div class="pagination">
        <button class="page-btn" [disabled]="page === 0" (click)="prevPage()"><i class="fa-solid fa-chevron-left"></i></button>
        <span>{{ page + 1 }} / {{ result()!.totalPages }}</span>
        <button class="page-btn" [disabled]="page >= result()!.totalPages - 1" (click)="nextPage()"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    }
  </div>
</div>
  `,
  styles: [`
:host {
  display: block; padding: 32px; min-height: 100%;
  font-family: 'Outfit', sans-serif; color: #f0f0fa;
  --accent: #7c3aed; --border: rgba(255,255,255,0.07); --bg-card: rgba(255,255,255,0.03);
  --text-dim: #6b6b8a; --transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
  --accent-glow: rgba(124,58,237,0.2);
}
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; margin: 0; display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg,#fff,rgba(255,255,255,.5)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.page-title i { -webkit-text-fill-color: var(--accent); }
.page-subtitle { color: var(--text-dim); font-size: 0.85rem; margin: 6px 0 0; }
.export-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; border: 1px solid var(--border); background: var(--accent-glow); color: #a78bfa; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: var(--transition); }
.export-btn:hover { background: rgba(124,58,237,0.3); }
.filters-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-input { padding: 9px 14px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; color: #fff; font-size: 0.85rem; font-family: 'Outfit', sans-serif; min-width: 160px; }
.filter-input:focus { outline: none; border-color: rgba(124,58,237,0.5); }
.filter-input[type=date] { color-scheme: dark; }
.admin-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; position: relative; }
.loading-overlay { position: absolute; inset: 0; background: rgba(7,8,16,0.5); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--accent); z-index: 5; }
.table-wrap { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { padding: 12px 14px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
.admin-table td { padding: 10px 14px; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
.admin-table tr:last-child td { border-bottom: none; }
.ts-cell { color: var(--text-dim); white-space: nowrap; font-size: 0.78rem; font-family: monospace; }
.admin-cell { font-weight: 700; }
.dim-cell { color: var(--text-dim); }
.ip-cell { font-family: monospace; font-size: 0.78rem; color: var(--text-dim); }
.detalle-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-dim); font-size: 0.8rem; }
.accion-chip { padding: 2px 10px; border-radius: 8px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; background: var(--accent-glow); color: #a78bfa; border: 1px solid rgba(124,58,237,0.2); white-space: nowrap; }
.empty-row { text-align: center; color: var(--text-dim); padding: 40px 16px !important; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid var(--border); font-size: 0.875rem; color: var(--text-dim); }
.page-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.page-btn:disabled { opacity: 0.3; cursor: default; }
  `],
})
export class AuditLogComponent implements OnInit {
  private svc = inject(AdminService);

  result = signal<PagedResult<AuditLogEntry> | null>(null);
  loading = signal(true);
  page = 0;

  // Filters
  adminFilter = '';
  tipoFilter = '';
  entidadFilter = '';
  fechaDesde = '';
  fechaHasta = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: any = { page: this.page, size: 30 };
    if (this.adminFilter) params.admin = this.adminFilter;
    if (this.tipoFilter) params.accion = this.tipoFilter;
    if (this.entidadFilter) params.entidadTipo = this.entidadFilter;
    if (this.fechaDesde) params.desde = this.fechaDesde;
    if (this.fechaHasta) params.hasta = this.fechaHasta;
    this.svc.getAuditLog(params).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv(): void {
    this.svc.exportAuditLog().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-ES');
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.load(); }
  }
}
