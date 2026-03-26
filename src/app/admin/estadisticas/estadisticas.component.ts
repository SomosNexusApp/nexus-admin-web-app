import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../admin.service';
import { AdminKpis, DiaValorDTO } from '../admin.models';
import { interval, Subscription, switchMap, startWith, forkJoin, tap, Observable } from 'rxjs';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  private adminSvc = inject(AdminService);
  
  kpis = signal<AdminKpis | null>(null);
  usuariosDia = signal<DiaValorDTO[]>([]);
  comprasDia = signal<DiaValorDTO[]>([]);
  topVendedores = signal<any[]>([]);
  loading = signal(true);
  lastUpdate = signal(new Date());

  private sub?: Subscription;

  ngOnInit(): void {
    // Polling every 5 seconds for "Live" feel
    this.sub = interval(5000).pipe(
      startWith(0),
      switchMap(() => {
        this.lastUpdate.set(new Date());
        return this.loadData();
      })
    ).subscribe({
      next: () => this.loading.set(false),
      error: (err) => console.error('Error fetching live stats:', err)
    });
  }

  private loadData() {
    return forkJoin({
      kpis: this.adminSvc.getKpis(),
      usuarios: this.adminSvc.getUsuariosPorDia(),
      compras: this.adminSvc.getComprasPorDia(),
      vendedores: this.adminSvc.getTopVendedores()
    }).pipe(
      tap(({ kpis, usuarios, compras, vendedores }) => {
        this.kpis.set(kpis);
        this.usuariosDia.set(usuarios || []);
        this.comprasDia.set(compras || []);
        this.topVendedores.set(vendedores || []);
      })
    );
  }

  getMax(data: DiaValorDTO[]): number {
    if (!data.length) return 1;
    return Math.max(...data.map(d => d.valor), 1);
  }

  getPercent(val: number, data: DiaValorDTO[]): number {
    const max = this.getMax(data);
    return (val / max) * 100;
  }

  hasRealActivity(vendedores: any[]): boolean {
    return vendedores.some(v => v.revenue > 0 || v.totalVentas > 0);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

