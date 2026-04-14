import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AdminCompra, PagedResult } from '../admin.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-compras-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AvatarComponent],
  templateUrl: './compras-admin.component.html',
  styleUrls: ['./compras-admin.component.css'],
})
export class ComprasAdminComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private fb = inject(FormBuilder);

  apiUrl = environment.apiUrl;

  compras = signal<AdminCompra[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  size = 20;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  filters = this.fb.group({
    estado: ['']
  });

  // ── Modal State ────────────────────────────────────────────────────────
  modalState = signal<'inactive' | 'confirm' | 'loading' | 'success' | 'error'>('inactive');
  modalTitle = signal('');
  modalMessage = signal('');
  modalConfirmLabel = signal('Confirmar');
  modalCancelLabel = signal('Cancelar');
  modalOnConfirm: () => void = () => {};

  estados = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'EN_TRANSITO', 'ENTREGADO', 'EN_DISPUTA', 'CANCELADA', 'REEMBOLSADA', 'COMPLETADA'];

  ngOnInit() {
    this.loadData();
    this.filters.valueChanges.subscribe(() => {
      this.currentPage.set(0);
      this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set(null);

    const { estado } = this.filters.value;
    const params: any = { page: this.currentPage(), size: this.size };
    if (estado) params.estado = estado;

    this.adminSvc.getCompras(params).subscribe({
      next: (res) => {
        this.compras.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading compras:', err);
        this.errorMessage.set(err.error?.error || 'Error de conexión con el servidor. Por favor, intenta de nuevo.');
        this.loading.set(false);
        this.compras.set([]);
      },
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return 'assets/no-image.png';
    if (path.startsWith('http')) return path;
    return `${this.apiUrl}/uploads/${path}`;
  }

  closeModal() {
    this.modalState.set('inactive');
  }

  reembolsar(id: number) {
    this.modalTitle.set('Confirmar Reembolso');
    this.modalMessage.set('¿Estás seguro de que deseas reembolsar esta compra al comprador? Esta acción llamará a Stripe y cancelará el pedido.');
    this.modalConfirmLabel.set('Confirmar Reembolso');
    this.modalState.set('confirm');
    this.modalOnConfirm = () => {
      this.modalState.set('loading');
      this.adminSvc.reembolsarCompra(id).subscribe({
        next: (res) => {
          this.modalTitle.set('Reembolso Exitoso');
          this.modalMessage.set('El reembolso se ha procesado correctamente. ' + (res.mensaje || ''));
          this.modalState.set('success');
          this.loadData();
        },
        error: (err) => {
          this.modalTitle.set('Error en Reembolso');
          this.modalMessage.set(err.error?.error || 'No se pudo procesar el reembolso en este momento.');
          this.modalState.set('error');
        }
      });
    };
  }

  cancelar(id: number) {
    this.modalTitle.set('Confirmar Cancelación');
    this.modalMessage.set('¿Seguro que deseas cancelar esta compra? Esta acción es irreversible.');
    this.modalConfirmLabel.set('Confirmar Cancelación');
    this.modalState.set('confirm');
    this.modalOnConfirm = () => {
      this.modalState.set('loading');
      this.adminSvc.cancelarCompra(id).subscribe({
        next: (res) => {
          this.modalTitle.set('Compra Cancelada');
          this.modalMessage.set('La compra ha sido marcada como cancelada. ' + (res.mensaje || ''));
          this.modalState.set('success');
          this.loadData();
        },
        error: (err) => {
          this.modalTitle.set('Error al Cancelar');
          this.modalMessage.set(err.error?.error || 'No se pudo cancelar la compra.');
          this.modalState.set('error');
        }
      });
    };
  }

  regenerarEtiqueta(id: number) {
    this.modalTitle.set('Regenerar Etiqueta');
    this.modalMessage.set('¿Deseas regenerar el código de envío? El código antiguo dejará de ser válido.');
    this.modalConfirmLabel.set('Regenerar');
    this.modalState.set('confirm');
    this.modalOnConfirm = () => {
      this.modalState.set('loading');
      this.adminSvc.regenerarEtiquetaCompra(id).subscribe({
        next: (res) => {
          this.modalTitle.set('Etiqueta Regenerada');
          this.modalMessage.set(`Nuevo código generado: ${res.nuevoCodigo}`);
          this.modalState.set('success');
          this.loadData();
        },
        error: (err) => {
          this.modalTitle.set('Error');
          this.modalMessage.set(err.error?.error || 'Error al regenerar etiqueta');
          this.modalState.set('error');
        }
      });
    };
  }

  refrescarTracking(id: number) {
    this.modalTitle.set('Actualizar seguimiento');
    this.modalMessage.set('Se consultará el estado real del transportista para este pedido.');
    this.modalConfirmLabel.set('Actualizar');
    this.modalState.set('confirm');
    this.modalOnConfirm = () => {
      this.modalState.set('loading');
      this.adminSvc.refreshTrackingCompra(id).subscribe({
        next: () => {
          this.modalTitle.set('Seguimiento actualizado');
          this.modalMessage.set('Se ha refrescado el tracking del pedido.');
          this.modalState.set('success');
          this.loadData();
        },
        error: (err) => {
          this.modalTitle.set('Error');
          this.modalMessage.set(err.error?.error || 'No se pudo refrescar el tracking.');
          this.modalState.set('error');
        }
      });
    };
  }

  getEstadoClasses(estado: string): string {
    const s = estado?.toUpperCase() || '';
    if (s === 'COMPLETADA' || s === 'ENTREGADO') return 'badge-success';
    if (s === 'REEMBOLSADA' || s === 'CANCELADA') return 'badge-danger';
    if (s === 'EN_DISPUTA') return 'badge-warning';
    if (s === 'ENVIADO' || s === 'EN_TRANSITO' || s === 'PAGADO') return 'badge-info';
    return 'badge-secondary';
  }
}
