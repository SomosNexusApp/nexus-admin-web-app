import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminOfertasService } from '../services/admin-ofertas.service';
import { AdminCategoriasService } from '../services/admin-categorias.service';
import { AdminOferta, PagedResult, AdminCategoria } from '../admin.models';
import { environment } from '../../../environments/enviroment';

@Component({
  selector: 'app-ofertas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ofertas-admin.component.html',
  styleUrls: ['./ofertas-admin.component.css']
})
export class OfertasAdminComponent implements OnInit {
  private ofertaSvc = inject(AdminOfertasService);
  private catSvc = inject(AdminCategoriasService);

  // Data
  result = signal<PagedResult<AdminOferta> | null>(null);
  loading = signal(true);
  selectedOferta = signal<AdminOferta | null>(null);
  panelOpen = signal(false);
  categorias = signal<AdminCategoria[]>([]);

  // Filters
  estadoFiltro = 'ACTIVA';
  page = 0;

  // Modals
  showRechazarModal = signal(false);
  showFlashModal = signal(false);
  motivoRechazo = '';

  // Flash Form
  flashForm = {
    titulo: '',
    descripcion: '',
    precioEspecial: null as number | null,
    precioOriginal: null as number | null,
    flashFin: '',
    limiteUnidades: 100,
    imagenPrincipal: '',
    tienda: '',
    urlOferta: '',
    categoriaId: null as number | null
  };

  ngOnInit(): void {
    this.loadOfertas();
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.catSvc.getArbol().subscribe(cats => {
      this.categorias.set(this.flattenCats(cats));
    });
  }

  private flattenCats(cats: AdminCategoria[]): AdminCategoria[] {
    let res: AdminCategoria[] = [];
    for (const c of cats) {
      res.push(c);
      if (c.hijos && c.hijos.length > 0) {
        res = res.concat(this.flattenCats(c.hijos));
      }
    }
    return res;
  }

  loadOfertas(): void {
    this.loading.set(true);
    this.ofertaSvc.buscar(this.estadoFiltro, this.page, 20).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openPanel(o: AdminOferta): void {
    this.selectedOferta.set(o);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  aprobar(id: number): void {
    this.ofertaSvc.aprobar(id).subscribe(() => {
      this.loadOfertas();
      this.closePanel();
    });
  }

  rechazar(): void {
    const o = this.selectedOferta();
    if (!o || !this.motivoRechazo) return;
    this.ofertaSvc.rechazar(o.id, this.motivoRechazo).subscribe(() => {
      this.showRechazarModal.set(false);
      this.motivoRechazo = '';
      this.loadOfertas();
      this.closePanel();
    });
  }

  toggleDestacada(id: number): void {
    this.ofertaSvc.toggleDestacada(id).subscribe({
      next: () => this.loadOfertas(),
      error: (err) => {
        // En un entorno real usaríamos un Toast, aquí lanzamos un alert por simplicidad o manejamos el error
        alert(err.error?.message || 'Error al destacar la oferta (máximo 3)');
      }
    });
  }

  crearFlash(): void {
    this.ofertaSvc.crearFlash(this.flashForm).subscribe(() => {
      this.showFlashModal.set(false);
      this.resetFlashForm();
      this.estadoFiltro = ''; // Ir a "Todas" para ver la nueva
      this.loadOfertas();
    });
  }

  resetFlashForm(): void {
    this.flashForm = {
      titulo: '', descripcion: '', precioEspecial: null, precioOriginal: null,
      flashFin: '', limiteUnidades: 100,
      imagenPrincipal: '', tienda: '', urlOferta: '', categoriaId: null
    };
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadOfertas(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.loadOfertas(); }
  }

  estadoLabel(estado: string): string {
    const labels: any = {
      'ACTIVA': 'Activa',
      'PENDIENTE_REVISION': 'Pendiente',
      'RECHAZADA': 'Rechazada',
      'CADUCADA': 'Caducada'
    };
    return labels[estado] || estado;
  }

  estadoClass(estado: string): string {
    if (estado === 'ACTIVA') return 'badge-green';
    if (estado === 'PENDIENTE_REVISION') return 'badge-orange';
    if (estado === 'RECHAZADA') return 'badge-red';
    return 'badge-gray';
  }
}
