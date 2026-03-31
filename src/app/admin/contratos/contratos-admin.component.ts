import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AdminContrato, AdminUsuario, AdminEmpresa } from '../admin.models';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-contratos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contratos-admin.component.html',
  styleUrls: ['./contratos-admin.component.css']
})
export class ContratosAdminComponent implements OnInit {
  private adminService = inject(AdminService);

  contratos = signal<AdminContrato[]>([]);
  empresas = signal<AdminEmpresa[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  
  // Autocomplete
  empresaSearchTerm = signal('');
  showCompanyDropdown = signal(false);
  selectedEmpresa = signal<AdminEmpresa | null>(null);

  // Modal State
  showModal = false;
  editingId: number | null = null;
  formModel: any = {
    empresaId: null,
    tipoContrato: 'BANNER',
    estado: 'DRAFT',
    fechaInicio: '',
    fechaFin: '',
    monto: 0,
    descripcion: '',
    productoId: null as number | null,
    textoBanner: '',
    urlClick: ''
  };

  filteredEmpresas = computed(() => {
    const term = this.empresaSearchTerm().toLowerCase();
    if (!term) return [];
    return this.empresas().filter(e => 
      e.nombreComercial.toLowerCase().includes(term) || 
      e.cif.toLowerCase().includes(term)
    );
  });

  // Stats
  stats = computed(() => {
    const list = this.contratos();
    return {
      activos: list.filter((c) => c.estado === 'ACTIVE').length,
      totalMonto: list.reduce((acc, c) => acc + (c.monto || 0), 0),
      pendientesAccion: list.filter(
        (c) => c.estado === 'PROPUESTA_ADMIN' || c.estado === 'PENDIENTE_PAGO',
      ).length,
    };
  });

  readonly estadosEdicion = [
    'DRAFT',
    'PROPUESTA_ADMIN',
    'PENDIENTE_PAGO',
    'ACTIVE',
    'RECHAZADO',
    'EXPIRED',
    'CANCELLED',
  ] as const;

  labelEstado(estado: string): string {
    const m: Record<string, string> = {
      DRAFT: 'Borrador',
      PROPUESTA_ADMIN: 'Propuesta enviada',
      PENDIENTE_PAGO: 'Pendiente de pago',
      ACTIVE: 'Activo',
      RECHAZADO: 'Rechazado',
      EXPIRED: 'Expirado',
      CANCELLED: 'Cancelado',
    };
    return m[estado] || estado;
  }

  filteredContratos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.contratos().filter(c => 
      c.empresa.nombreComercial.toLowerCase().includes(term) ||
      c.empresa.cif.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.loadData();
    this.loadEmpresas();
  }

  loadData() {
    this.loading.set(true);
    this.adminService.getContratos()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => this.contratos.set(res));
  }

  loadEmpresas() {
    this.adminService.getEmpresas().subscribe(res => {
      const mapped: AdminEmpresa[] = res.map(e => ({
        id: e.id,
        nombreComercial: e.nombreComercial,
        cif: e.cif,
        logo: e.logo
      }));
      this.empresas.set(mapped);
    });
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value);
  }

  openCreateModal() {
    this.editingId = null;
    this.selectedEmpresa.set(null);
    this.empresaSearchTerm.set('');
    this.formModel = {
      empresaId: null,
      tipoContrato: 'BANNER',
      estado: 'DRAFT',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      monto: 100,
      descripcion: '',
      productoId: null,
      textoBanner: '',
      urlClick: ''
    };
    this.showModal = true;
  }

  openEditModal(c: AdminContrato) {
    this.editingId = c.id;
    this.selectedEmpresa.set(c.empresa);
    this.formModel = {
      empresaId: c.empresa.id,
      tipoContrato: c.tipoContrato,
      estado: c.estado,
      fechaInicio: c.fechaInicio ? c.fechaInicio.split('T')[0] : '',
      fechaFin: c.fechaFin ? c.fechaFin.split('T')[0] : '',
      monto: c.monto,
      descripcion: c.descripcion,
      productoId: c.productoId ?? null,
      textoBanner: c.textoBanner ?? '',
      urlClick: c.urlClick ?? '',
    };
    this.showModal = true;
  }

  selectEmpresa(e: AdminEmpresa) {
    this.selectedEmpresa.set(e);
    this.formModel.empresaId = e.id;
    this.showCompanyDropdown.set(false);
    this.empresaSearchTerm.set('');
  }

  clearEmpresa() {
    this.selectedEmpresa.set(null);
    this.formModel.empresaId = null;
  }

  closeModal() {
    this.showModal = false;
    this.showCompanyDropdown.set(false);
  }

  handleOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  isFormValid() {
    if (!this.formModel.empresaId || !this.formModel.monto || this.formModel.monto <= 0) {
      return false;
    }
    return true;
  }

  saveContrato() {
    if (!this.isFormValid()) return;
    this.loading.set(true);

    const payload: Record<string, unknown> = { ...this.formModel };
    if (!this.editingId) {
      delete payload['estado'];
    }

    if (this.editingId) {
      this.adminService.updateContrato(this.editingId, payload as Partial<AdminContrato>)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe(() => {
          this.loadData();
          this.closeModal();
        });
    } else {
      this.adminService.createContrato(this.formModel.empresaId, payload as Partial<AdminContrato>)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe(() => {
          this.loadData();
          this.closeModal();
        });
    }
  }

  confirmDelete(c: AdminContrato) {
    if (confirm(`¿Estás seguro de eliminar el contrato de ${c.empresa.nombreComercial}?`)) {
      this.adminService.deleteContrato(c.id).subscribe(() => this.loadData());
    }
  }
}
