import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { AdminProductosService } from '../services/admin-productos.service';
import { AdminCategoriasService } from '../services/admin-categorias.service';
import { AdminService } from '../admin.service';
import { AdminProducto, AdminCategoria, AdminEmpresa, PagedResult } from '../admin.models';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-productos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './productos-admin.component.html',
  styleUrls: ['./productos-admin.component.css']
})
export class ProductosAdminComponent implements OnInit {
  private productoSvc = inject(AdminProductosService);
  private categoriaSvc = inject(AdminCategoriasService);
  private adminSvc = inject(AdminService);
  private toast = inject(ToastService);

  // Data signals
  result = signal<PagedResult<AdminProducto> | null>(null);
  loading = signal(true);
  categorias = signal<AdminCategoria[]>([]);
  selectedProduct = signal<AdminProducto | null>(null);
  panelOpen = signal(false);

  // Filters
  filtros = {
    q: '',
    categoriaId: null as number | null,
    estado: '',
    vendedorId: null as number | null,
    precioMin: null as number | null,
    precioMax: null as number | null,
    fechaDesde: ''
  };
  page = 0;

  // Modals existentes
  showPausarModal = signal(false);
  showEliminarModal = signal(false);
  motivoAccion = '';
  duracionPausa = 24;

  // ── Modal Publicitar ───────────────────────────────────────────────────────
  showPublicitarModal = signal(false);
  loadingPublicitar = signal(false);
  publicitar_producto: AdminProducto | null = null;
  publicitar_empresa: AdminEmpresa | null = null;
  publicitar_busqueda = '';
  publicitar_monto = 299;
  publicitar_desc = '';
  publicitar_lista: AdminEmpresa[] = [];

  /** Todas las empresas cargadas una sola vez */
  private _empresas: AdminEmpresa[] = [];

  private search$ = new Subject<void>();

  ngOnInit(): void {
    this.loadInitialData();
    this.search$.pipe(debounceTime(400)).subscribe(() => {
      this.page = 0;
      this.loadProductos();
    });
    // Precargar lista de empresas para el modal "Publicitar"
    this.adminSvc.getEmpresas().subscribe({
      next: (res: any[]) => {
        this._empresas = res.map((e: any) => ({
          id: e.id,
          nombreComercial: e.nombreComercial || e.user || 'Empresa',
          cif: e.cif || '',
          logo: e.logo
        }));
      }
    });
  }

  loadInitialData(): void {
    this.categoriaSvc.getArbol().subscribe(cats => this.categorias.set(cats));
    this.loadProductos();
  }

  onSearch(): void {
    this.search$.next();
  }

  loadProductos(): void {
    this.loading.set(true);
    this.productoSvc.buscar(this.filtros, this.page, 20).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openPanel(p: AdminProducto): void {
    this.selectedProduct.set(p);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  openProductUrl(id: number): void {
    window.open(`${environment.appUrl}/productos/${id}`, '_blank');
  }

  toggleDestacado(id: number): void {
    this.productoSvc.toggleDestacado(id).subscribe(p => {
      this.loadProductos();
      const current = this.selectedProduct();
      if (current && current.id === id) this.selectedProduct.set(p);
    });
  }

  doPausar(): void {
    const p = this.selectedProduct();
    if (!p || !this.motivoAccion) return;
    this.productoSvc.pausar(p.id, this.motivoAccion, this.duracionPausa).subscribe(() => {
      this.showPausarModal.set(false);
      this.motivoAccion = '';
      this.loadProductos();
      this.closePanel();
    });
  }

  doReactivar(): void {
    const p = this.selectedProduct();
    if (!p) return;
    this.productoSvc.reactivar(p.id).subscribe(() => {
      this.loadProductos();
      this.closePanel();
    });
  }

  doEliminar(): void {
    const p = this.selectedProduct();
    if (!p || !this.motivoAccion) return;
    this.productoSvc.eliminar(p.id, this.motivoAccion).subscribe(() => {
      this.showEliminarModal.set(false);
      this.motivoAccion = '';
      this.loadProductos();
      this.closePanel();
    });
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadProductos();
    }
  }

  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) {
      this.page++;
      this.loadProductos();
    }
  }

  estadoLabel(estado: string): string {
    const labels: any = {
      'DISPONIBLE': 'En venta',
      'RESERVADO': 'Reservado',
      'VENDIDO': 'Vendido',
      'PAUSADO': 'Pausado',
      'ELIMINADO': 'Eliminado',
      'SUSPENDIDO_ADMIN': 'Suspendido'
    };
    return labels[estado] || estado;
  }

  estadoClass(estado: string): string {
    if (estado === 'DISPONIBLE') return 'badge-green';
    if (estado === 'RESERVADO') return 'badge-blue';
    if (estado === 'VENDIDO') return 'badge-gray';
    if (estado === 'PAUSADO' || estado === 'SUSPENDIDO_ADMIN') return 'badge-orange';
    if (estado === 'ELIMINADO') return 'badge-red';
    return '';
  }

  // ── Publicitar ─────────────────────────────────────────────────────────────

  openPublicitarModal(p: AdminProducto): void {
    this.publicitar_producto = p;
    this.publicitar_empresa = null;
    this.publicitar_busqueda = '';
    this.publicitar_monto = 299;
    this.publicitar_desc = `Producto patrocinado: ${p.titulo}. Destacado en portada durante 30 días.`;
    this.publicitar_lista = this._empresas.slice(0, 10);
    this.showPublicitarModal.set(true);
  }

  filtrarEmpresasPublicitar(): void {
    const term = this.publicitar_busqueda.toLowerCase().trim();
    if (!term) {
      this.publicitar_lista = this._empresas.slice(0, 10);
    } else {
      this.publicitar_lista = this._empresas
        .filter(e =>
          e.nombreComercial.toLowerCase().includes(term) ||
          e.cif.toLowerCase().includes(term)
        )
        .slice(0, 10);
    }
  }

  seleccionarEmpresaPublicitar(e: AdminEmpresa): void {
    this.publicitar_empresa = e;
    this.publicitar_lista = [];
    this.publicitar_busqueda = '';
  }

  doPublicitar(): void {
    if (!this.publicitar_empresa || !this.publicitar_producto || !this.publicitar_monto) return;
    this.loadingPublicitar.set(true);

    const payload: any = {
      tipoContrato: 'PUBLICACION',
      monto: this.publicitar_monto,
      descripcion: this.publicitar_desc,
      productoId: this.publicitar_producto.id,
    };

    this.adminSvc.createContrato(this.publicitar_empresa.id, payload).subscribe({
      next: () => {
        this.loadingPublicitar.set(false);
        this.showPublicitarModal.set(false);
        this.toast.success(`Propuesta enviada a ${this.publicitar_empresa!.nombreComercial}. Recibirán notificación y email.`);
        this.publicitar_empresa = null;
        this.publicitar_producto = null;
        this.loadProductos();
      },
      error: (err: any) => {
        this.loadingPublicitar.set(false);
        this.toast.error(err?.error?.error || 'Error al crear la propuesta. Inténtalo de nuevo.');
      }
    });
  }
}
