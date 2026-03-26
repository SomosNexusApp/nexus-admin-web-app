import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminCategoriasService } from '../services/admin-categorias.service';
import { AdminCategoria } from '../admin.models';

@Component({
  selector: 'app-categorias-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categorias-admin.component.html',
  styleUrls: ['./categorias-admin.component.css']
})
export class CategoriasAdminComponent implements OnInit {
  private catSvc = inject(AdminCategoriasService);

  categorias = signal<AdminCategoria[]>([]);
  loading = signal(true);
  
  // Edit/Create state
  selectedCat = signal<AdminCategoria | null>(null);
  panelOpen = signal(false);
  isNew = false;

  catForm = {
    nombre: '',
    slug: '',
    icono: '',
    color: '#7c3aed',
    parentId: null as number | null
  };

  slugExists = signal(false);

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading.set(true);
    this.catSvc.getArbol().subscribe({
      next: data => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreate(parent: AdminCategoria | null = null): void {
    this.isNew = true;
    this.selectedCat.set(null);
    this.catForm = {
      nombre: '',
      slug: '',
      icono: 'fa-tag',
      color: '#7c3aed',
      parentId: parent ? parent.id : null
    };
    this.panelOpen.set(true);
  }

  openEdit(cat: AdminCategoria): void {
    this.isNew = false;
    this.selectedCat.set(cat);
    this.catForm = {
      nombre: cat.nombre,
      slug: cat.slug,
      icono: cat.icono || 'fa-tag',
      color: cat.color || '#7c3aed',
      parentId: cat.parent ? cat.parent.id : null
    };
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  onNombreChange(): void {
    if (this.isNew) {
      this.catForm.slug = this.catForm.nombre
        .toLowerCase()
        .trim()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      this.checkSlug();
    }
  }

  checkSlug(): void {
    if (!this.catForm.slug) return;
    this.catSvc.checkSlug(this.catForm.slug).subscribe(res => {
      this.slugExists.set(res.exists);
    });
  }

  save(): void {
    if (this.isNew) {
      this.catSvc.crear(this.catForm).subscribe(() => {
        this.loadCategorias();
        this.closePanel();
      });
    } else {
      const id = this.selectedCat()!.id;
      this.catSvc.editar(id, this.catForm).subscribe(() => {
        this.loadCategorias();
        this.closePanel();
      });
    }
  }

  toggleActiva(cat: AdminCategoria): void {
    this.catSvc.toggleActiva(cat.id).subscribe(() => {
      this.loadCategorias();
    });
  }

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta categoría? Si tiene subcategorías o productos, la acción podría fallar o quedar huérfanos.')) {
      this.catSvc.eliminar(id).subscribe(() => {
        this.loadCategorias();
        if (this.selectedCat()?.id === id) this.closePanel();
      });
    }
  }

  moveUp(cat: AdminCategoria, siblings: AdminCategoria[]): void {
    const idx = siblings.indexOf(cat);
    if (idx > 0) {
      this.reorder(siblings[idx], siblings[idx-1]);
    }
  }

  moveDown(cat: AdminCategoria, siblings: AdminCategoria[]): void {
    const idx = siblings.indexOf(cat);
    if (idx < siblings.length - 1) {
      this.reorder(siblings[idx], siblings[idx+1]);
    }
  }

  private reorder(a: AdminCategoria, b: AdminCategoria): void {
    const items = [
      { id: a.id, nuevoOrden: b.orden, padreId: a.parent?.id },
      { id: b.id, nuevoOrden: a.orden, padreId: b.parent?.id }
    ];
    this.catSvc.reordenar(items).subscribe(() => this.loadCategorias());
  }
}
