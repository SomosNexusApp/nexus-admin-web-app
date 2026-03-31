import { Component, OnInit, inject, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject, distinctUntilChanged, switchMap, map } from 'rxjs';
import { AdminCuponesService } from '../services/admin-cupones.service';
import { AdminService } from '../admin.service';
import { AdminCategoriasService } from '../services/admin-categorias.service';
import { AdminCupon, CuponUso, CuponStats, PagedResult, AdminUsuario, AdminCategoria } from '../admin.models';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-cupones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cupones-admin.component.html',
  styleUrls: ['./cupones-admin.component.css'],
  providers: [CurrencyPipe, DatePipe]
})
export class CuponesAdminComponent implements OnInit {
  private cuponSvc = inject(AdminCuponesService);
  private adminSvc = inject(AdminService);
  private catSvc = inject(AdminCategoriasService);
  private clipboard = inject(Clipboard);

  // Data
  result = signal<PagedResult<AdminCupon> | null>(null);
  stats = signal<CuponStats | null>(null);
  loading = signal(true);
  
  // Tabs
  tabActiva: 'activos' | 'caducados' | 'desactivados' | 'todos' = 'activos';
  page = 0;

  // Modals
  showModal = signal(false);
  showUsosModal = signal(false);
  usosResult = signal<PagedResult<CuponUso> | null>(null);
  selectedCuponForUsos = signal<AdminCupon | null>(null);

  // Stepper
  step = 1;
  isNew = true;
  editingId: number | null = null;

  // Form
  form = {
    codigo: '',
    tipo: 'PORCENTAJE' as 'PORCENTAJE' | 'FIJO' | 'ENVIO_GRATIS' | 'COMBINADO',
    valor: null as number | null,
    valorFijo: null as number | null,
    valorPorcentaje: null as number | null,
    importeMinimo: null as number | null,
    topeMaximo: null as number | null,
    alcance: 'TODOS' as 'TODOS' | 'USUARIO' | 'GRUPO',
    usuario: null as AdminUsuario | null,
    grupoObjetivo: '',
    limiteUsoTotal: null as number | null,
    limiteUsoPorUsuario: 1,
    fechaInicio: '',
    fechaFin: '',
    categoriasIds: [] as number[],
    descripcionInterna: '',
    activo: true,
    ilimitado: true,
    sinCaducidad: true,
    todasCategorias: true,
    requiereMinimo: false,
    limitarTope: false
  };

  // Codigo Async Check
  codigoDisponible = signal<boolean | null>(null);
  private codigoSubject = new Subject<string>();

  // Autocomplete Usuarios
  usuariosSearchValue = '';
  usuariosSugeridos = signal<AdminUsuario[]>([]);
  private userSearchSubject = new Subject<string>();

  // Categorias Tree
  categoriasArbol = signal<AdminCategoria[]>([]);

  // Clipboard
  copiedCode = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStats();
    this.loadCupones();
    this.setupAsyncChecks();
    this.loadCategorias();
  }

  setupAsyncChecks(): void {
    this.codigoSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(code => this.cuponSvc.checkCodigo(code))
    ).subscribe(res => this.codigoDisponible.set(res.disponible));

    this.userSearchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => this.adminSvc.getUsuarios({ q, page: 0, size: 5 }).pipe(map(r => r.content)))
    ).subscribe(users => this.usuariosSugeridos.set(users));
  }

  loadCupones(): void {
    this.loading.set(true);
    let activo: boolean | undefined = undefined;
    let caducado: boolean | undefined = undefined;

    if (this.tabActiva === 'activos') { activo = true; caducado = false; }
    if (this.tabActiva === 'caducados') { activo = true; caducado = true; }
    if (this.tabActiva === 'desactivados') { activo = false; }

    this.cuponSvc.buscar(activo, caducado, this.page).subscribe({
      next: (r: any) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadStats(): void {
    this.cuponSvc.getStats().subscribe(s => this.stats.set(s));
  }

  loadCategorias(): void {
    this.catSvc.getArbol().subscribe(data => this.categoriasArbol.set(data));
  }

  openNew() {
    this.isNew = true;
    this.step = 1;
    this.resetForm();
    this.showModal.set(true);
  }

  openEdit(c: AdminCupon) {
    this.isNew = false;
    this.editingId = c.id;
    this.step = 1;
    // Fill form
    this.form = {
      ...this.form,
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor || null,
      valorFijo: c.valorFijo || null,
      valorPorcentaje: c.valorPorcentaje || null,
      importeMinimo: c.importeMinimo || null,
      requiereMinimo: !!c.importeMinimo,
      topeMaximo: c.topeMaximo || null,
      limitarTope: !!c.topeMaximo,
      alcance: c.alcance,
      usuario: c.usuario as any,
      grupoObjetivo: c.grupoObjetivo || '',
      limiteUsoTotal: c.limiteUsoTotal || null,
      ilimitado: c.limiteUsoTotal === null,
      limiteUsoPorUsuario: c.limiteUsoPorUsuario,
      fechaInicio: c.fechaInicio.substring(0, 16),
      fechaFin: c.fechaFin ? c.fechaFin.substring(0, 16) : '',
      sinCaducidad: !c.fechaFin,
      categoriasIds: c.categoriasIds ? c.categoriasIds.split(',').map(Number) : [],
      todasCategorias: !c.categoriasIds,
      descripcionInterna: c.descripcionInterna,
      activo: c.activo
    };
    this.showModal.set(true);
  }

  resetForm() {
    this.form = {
      codigo: '', tipo: 'PORCENTAJE', valor: null, valorFijo: null, valorPorcentaje: null,
      importeMinimo: null, topeMaximo: null,
      alcance: 'TODOS', usuario: null, grupoObjetivo: 'NUEVOS_USUARIOS',
      limiteUsoTotal: null, limiteUsoPorUsuario: 1, fechaInicio: new Date().toISOString().substring(0, 16),
      fechaFin: '', categoriasIds: [], descripcionInterna: '', activo: true,
      ilimitado: true, sinCaducidad: true, todasCategorias: true, requiereMinimo: false, limitarTope: false
    };
    this.codigoDisponible.set(null);
  }

  onCodigoChange() {
    if (this.isNew) {
      this.form.codigo = this.form.codigo.toUpperCase().replace(/\s/g, '');
      if (this.form.codigo.length >= 4) {
        this.codigoSubject.next(this.form.codigo);
      } else {
        this.codigoDisponible.set(null);
      }
    }
  }

  generarAleatorio() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'NEXUS-';
    for(let i=0; i<6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    this.form.codigo = code;
    this.onCodigoChange();
  }

  onUserSearch() {
    if (this.usuariosSearchValue.length > 2) {
      this.userSearchSubject.next(this.usuariosSearchValue);
    }
  }

  selectUsuario(u: AdminUsuario) {
    this.form.usuario = u;
    this.usuariosSugeridos.set([]);
    this.usuariosSearchValue = '';
  }

  toggleCategoria(id: number) {
    const idx = this.form.categoriasIds.indexOf(id);
    if (idx > -1) this.form.categoriasIds.splice(idx, 1);
    else this.form.categoriasIds.push(id);
  }

  nextStep() { if (this.step < 3) this.step++; }
  prevStep() { if (this.step > 1) this.step--; }

  save() {
    const payload = {
      ...this.form,
      limiteUsoTotal: this.form.ilimitado ? null : this.form.limiteUsoTotal,
      fechaFin: this.form.sinCaducidad ? null : this.form.fechaFin,
      importeMinimo: this.form.requiereMinimo ? this.form.importeMinimo : null,
      topeMaximo: (this.form.tipo === 'PORCENTAJE' && this.form.limitarTope) ? this.form.topeMaximo : null,
      categoriasIds: this.form.todasCategorias ? null : this.form.categoriasIds.join(','),
      usuario: this.form.alcance === 'USUARIO' ? this.form.usuario : null
    };

    if (this.isNew) {
      this.cuponSvc.crear(payload).subscribe(() => this.onSaveSuccess());
    } else {
      this.cuponSvc.editar(this.editingId!, payload).subscribe(() => this.onSaveSuccess());
    }
  }

  onSaveSuccess() {
    this.showModal.set(false);
    this.loadCupones();
    this.loadStats();
    // En un entorno real aquí mostraríamos un Toast
  }

  confirmDesactivar(c: AdminCupon) {
     if(confirm(`¿Desactivar el códio ${c.codigo}? Dejará de ser válido de inmediato.`)) {
       this.cuponSvc.desactivar(c.id).subscribe(() => this.loadCupones());
     }
  }

  reactivar(c: AdminCupon) {
    this.cuponSvc.reactivar(c.id).subscribe(() => this.loadCupones());
  }

  eliminar(c: AdminCupon) {
    if(confirm('¿Seguro que quieres ELIMINAR este cupón? Esta acción no se puede deshacer.')) {
      this.cuponSvc.eliminar(c.id).subscribe(() => { this.loadCupones(); this.loadStats(); });
    }
  }

  openUsos(c: AdminCupon) {
    this.selectedCuponForUsos.set(c);
    this.page = 0;
    this.loadUsos(c.id);
    this.showUsosModal.set(true);
  }

  loadUsos(id: number) {
    this.cuponSvc.getUsos(id, this.page).subscribe(res => this.usosResult.set(res));
  }

  exportCSV() {
    // Lógica ficticia de exportación basado en usosResult()
    const content = 'Usuario,Fecha,Ahorro\n' + this.usosResult()?.content.map(u => `${u.usuario.user},${u.fechaUso},${u.importeAhorro}`).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usos_${this.selectedCuponForUsos()?.codigo}.csv`;
    a.click();
  }

  copyToClipboard(code: string) {
    this.clipboard.copy(code);
    this.copiedCode.set(code);
    setTimeout(() => this.copiedCode.set(null), 2000);
  }
}
