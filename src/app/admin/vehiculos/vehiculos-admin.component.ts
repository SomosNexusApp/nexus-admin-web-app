import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { AdminVehiculosService } from '../services/admin-vehiculos.service';
import { AdminVehiculo, PagedResult } from '../admin.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vehiculos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vehiculos-admin.component.html',
  styleUrls: ['./vehiculos-admin.component.css']
})
export class VehiculosAdminComponent implements OnInit {
  private vehiculoSvc = inject(AdminVehiculosService);

  // Data
  result = signal<PagedResult<AdminVehiculo> | null>(null);
  loading = signal(true);
  selectedVehiculo = signal<AdminVehiculo | null>(null);
  panelOpen = signal(false);

  // Filters
  filtros = {
    q: '',
    tipo: '',
    estado: '',
    precioMin: null as number | null,
    precioMax: null as number | null,
    anioMin: null as number | null,
    kmMax: null as number | null
  };
  page = 0;

  // Modals
  showPausarModal = signal(false);
  showEliminarModal = signal(false);
  motivoAccion = '';

  private search$ = new Subject<void>();

  ngOnInit(): void {
    this.loadVehiculos();
    this.search$.pipe(debounceTime(400)).subscribe(() => {
      this.page = 0;
      this.loadVehiculos();
    });
  }

  onSearch(): void {
    this.search$.next();
  }

  loadVehiculos(): void {
    this.loading.set(true);
    this.vehiculoSvc.buscar(this.filtros, this.page, 20).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openPanel(v: AdminVehiculo): void {
    this.selectedVehiculo.set(v);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  openVehiculoUrl(id: number): void {
    window.open(`${environment.appUrl}/vehiculos/${id}`, '_blank');
  }

  viewUser(username: string): void {
    window.open(`${environment.appUrl}/perfil/${username}`, '_blank');
  }

  doPausar(): void {
    const v = this.selectedVehiculo();
    if (!v || !this.motivoAccion) return;
    this.vehiculoSvc.pausar(v.id, this.motivoAccion).subscribe(() => {
      this.showPausarModal.set(false);
      this.motivoAccion = '';
      this.loadVehiculos();
      this.closePanel();
    });
  }

  doReactivar(): void {
    const v = this.selectedVehiculo();
    if (!v) return;
    this.vehiculoSvc.reactivar(v.id).subscribe(() => {
      this.loadVehiculos();
      this.closePanel();
    });
  }

  doEliminar(): void {
    const v = this.selectedVehiculo();
    if (!v || !this.motivoAccion) return;
    this.vehiculoSvc.eliminar(v.id, this.motivoAccion).subscribe(() => {
      this.showEliminarModal.set(false);
      this.motivoAccion = '';
      this.loadVehiculos();
      this.closePanel();
    });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadVehiculos(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.loadVehiculos(); }
  }

  estadoLabel(estado: string): string {
    const labels: any = {
      'DISPONIBLE': 'En venta',
      'VENDIDO': 'Vendido',
      'PAUSADO': 'Pausado Admin',
      'EXPIRADO': 'Caducado',
      'ELIMINADO': 'Eliminado'
    };
    return labels[estado] || estado;
  }

  estadoClass(estado: string): string {
    if (estado === 'DISPONIBLE') return 'badge-green';
    if (estado === 'VENDIDO') return 'badge-gray';
    if (estado === 'PAUSADO') return 'badge-orange';
    if (estado === 'EXPIRADO') return 'badge-pink';
    if (estado === 'ELIMINADO') return 'badge-red';
    return '';
  }
}
