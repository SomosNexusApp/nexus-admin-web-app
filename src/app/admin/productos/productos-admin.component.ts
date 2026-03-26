import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { AdminProductosService } from '../services/admin-productos.service';
import { AdminCategoriasService } from '../services/admin-categorias.service';
import { AdminProducto, AdminCategoria, PagedResult } from '../admin.models';
import { environment } from '../../../environments/enviroment';

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

  // Modals
  showPausarModal = signal(false);
  showEliminarModal = signal(false);
  motivoAccion = '';
  duracionPausa = 24;

  private search$ = new Subject<void>();

  ngOnInit(): void {
    this.loadInitialData();
    this.search$.pipe(debounceTime(400)).subscribe(() => {
      this.page = 0;
      this.loadProductos();
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
      // Update local state if needed or reload
      this.loadProductos();
      const current = this.selectedProduct();
      if(current && current.id === id) this.selectedProduct.set(p);
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
}
