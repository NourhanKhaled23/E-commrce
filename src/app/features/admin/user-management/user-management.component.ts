import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly dialog = inject(DialogService);
  readonly users = this.admin.users;
  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');
  readonly selectedUser = signal<any>(null);
  readonly editStatus = signal('');
  readonly sortField = signal('id');
  readonly sortDir = signal<'asc'|'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filteredUsers = computed(() => {
    return this.users().filter(u => {
      if (this.roleFilter() && u.role !== this.roleFilter()) return false;
      if (this.statusFilter() && (u.status || 'active') !== this.statusFilter()) return false;
      if (this.searchQuery()) {
        const q = this.searchQuery().toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const key = this.sortField();
      const va = (a as any)[key] ?? '';
      const vb = (b as any)[key] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
  });

  readonly totalUsers = computed(() => this.filteredUsers().length);

  readonly paginatedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  readonly paginationStart = computed(() => (this.page() - 1) * this.pageSize + 1);
  readonly paginationEnd = computed(() => Math.min(this.page() * this.pageSize, this.totalUsers()));

  readonly pageNumbers = computed(() => {
    const tp = Math.max(1, Math.ceil(this.totalUsers() / this.pageSize));
    const p = this.page();
    const pages: number[] = [];
    const start = Math.max(1, p - 2);
    const end = Math.min(tp, p + 2);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push(0);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < tp - 1) pages.push(0);
    if (end < tp) pages.push(tp);
    return pages;
  });

  ngOnInit(): void {
    this.admin.loadAll();
  }

  sort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  async restrictUser(user: any): Promise<void> {
    const confirmed = await this.dialog.open(
      'Restrict User',
      `Are you sure you want to restrict ${user.name}? They will no longer be able to access the platform.`,
      { confirmLabel: 'Restrict User', danger: true }
    );
    if (!confirmed) return;
    this.admin.updateUserStatus(user.id, 'restricted').subscribe(() => {
      this.admin.users.update(users => users.map(u => u.id === user.id ? { ...u, status: 'restricted' } : u));
      this.selectedUser.set(null);
    });
  }

  approveUser(id: number): void {
    this.admin.updateUserStatus(id, 'active').subscribe(() => {
      this.admin.users.update(users => users.map(u => u.id === id ? { ...u, status: 'active' } : u));
      this.selectedUser.set(null);
    });
  }

  openUser(user: any): void {
    this.selectedUser.set(user);
    this.editStatus.set(user.status || 'active');
  }

  closeUserModal(): void {
    this.selectedUser.set(null);
  }

  exportCsv(): void {
    const rows = this.filteredUsers();
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Wallet', 'Points'];
    const csv = [headers.join(','), ...rows.map((u: any) => [
      u.id, `"${u.name}"`, `"${u.email}"`, u.role, u.status || 'active',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      u.walletBalance, u.loyaltyPoints
    ].join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
