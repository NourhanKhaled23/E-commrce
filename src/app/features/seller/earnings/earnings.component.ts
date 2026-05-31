import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { SellerService } from '../../../core/services/seller.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="earnings-page">
      <div class="earnings-header">
        <div>
          <h1 class="page-title">Earnings</h1>
          <p class="page-sub">Track your revenue and payouts</p>
        </div>
        <button class="btn-payout" (click)="requestPayout()">
          <i class="bi bi-cash-stack"></i> REQUEST PAYOUT
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon"><i class="bi bi-graph-up-arrow"></i></div>
            <span class="kpi-label">TOTAL REVENUE</span>
          </div>
          <div class="kpi-value">{{ seller.earnings() | currency:'USD':'symbol':'1.2-2' }}</div>
          <div class="kpi-sub">All time earnings</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon"><i class="bi bi-percent"></i></div>
            <span class="kpi-label">PLATFORM FEES</span>
          </div>
          <div class="kpi-value">{{ totalFees() | currency:'USD':'symbol':'1.2-2' }}</div>
          <div class="kpi-sub">10% platform rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon"><i class="bi bi-cash-coin"></i></div>
            <span class="kpi-label">NET EARNINGS</span>
          </div>
          <div class="kpi-value">{{ totalNet() | currency:'USD':'symbol':'1.2-2' }}</div>
          <div class="kpi-sub">After fees</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-icon"><i class="bi bi-wallet2"></i></div>
            <span class="kpi-label">PENDING PAYOUT</span>
          </div>
          <div class="kpi-value">{{ pendingPayout() | currency:'USD':'symbol':'1.2-2' }}</div>
          <div class="kpi-sub">Awaiting withdrawal</div>
        </div>
      </div>

      <!-- Monthly Breakdown -->
      <div class="section-card">
        <div class="section-header">
          <h3><i class="bi bi-calendar3"></i> Monthly Breakdown</h3>
        </div>

        @if (seller.monthlyEarnings().length === 0) {
          <div class="empty-state">
            <i class="bi bi-bar-chart-line"></i>
            <p>No earnings data yet</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Platform Fee (10%)</th>
                  <th>Net Payout</th>
                </tr>
              </thead>
              <tbody>
                @for (row of seller.monthlyEarnings(); track row.month) {
                  <tr>
                    <td class="month-cell">
                      <i class="bi bi-calendar-event"></i> {{ formatMonth(row.month) }}
                    </td>
                    <td>
                      <span class="orders-badge">{{ row.orders }}</span>
                    </td>
                    <td class="revenue-cell">{{ row.revenue | currency }}</td>
                    <td class="fee-cell">-{{ row.platformFee | currency }}</td>
                    <td class="net-cell">{{ row.netPayout | currency }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>{{ totalOrders() }}</strong></td>
                  <td><strong>{{ seller.earnings() | currency }}</strong></td>
                  <td class="fee-cell"><strong>-{{ totalFees() | currency }}</strong></td>
                  <td class="net-cell"><strong>{{ totalNet() | currency }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </div>

      <!-- Payout History -->
      <div class="section-card">
        <div class="section-header">
          <h3><i class="bi bi-clock-history"></i> Payout History</h3>
        </div>

        @if (seller.payouts().length === 0) {
          <div class="empty-state">
            <i class="bi bi-wallet"></i>
            <p>No payouts yet</p>
          </div>
        } @else {
          <div class="payout-list">
            @for (payout of seller.payouts(); track payout.id) {
              <div class="payout-item">
                <div class="payout-left">
                  <div class="payout-icon-wrap"
                       [class.paid]="payout.status === 'paid'"
                       [class.pending]="payout.status === 'pending'"
                       [class.processing]="payout.status === 'processing'">
                    @if (payout.status === 'paid') {
                      <i class="bi bi-check-circle-fill"></i>
                    } @else if (payout.status === 'processing') {
                      <i class="bi bi-arrow-repeat"></i>
                    } @else {
                      <i class="bi bi-clock"></i>
                    }
                  </div>
                  <div class="payout-info">
                    <span class="payout-ref">{{ payout.reference }}</span>
                    <span class="payout-date">{{ payout.requestedAt | date:'mediumDate' }}</span>
                  </div>
                </div>
                <div class="payout-right">
                  <div class="payout-amounts">
                    <span class="payout-amount">{{ payout.net | currency }}</span>
                    <span class="payout-fee">Fee: {{ payout.fee | currency }}</span>
                  </div>
                  <span class="payout-status-badge" [attr.data-pstatus]="payout.status">
                    {{ payout.status | titlecase }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .earnings-page { max-width: 1000px; }

    .earnings-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      color: #0D0D0D;
      margin: 0;
    }
    .page-sub { font-size: 13px; color: #6B5C3E; margin-top: 2px; }

    .btn-payout {
      background: #C8A96E;
      color: #0D0D0D;
      border: none;
      border-radius: 2px;
      padding: 11px 22px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 200ms ease;
      white-space: nowrap;
      &:hover { background: #8B6914; }
      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }

    /* ── KPI Cards ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      background: #FFFFFF;
      border: 0.5px solid #E8E0D4;
      border-radius: 2px;
      padding: 18px 20px;
      transition: box-shadow 200ms ease;
      &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    }
    .kpi-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .kpi-icon {
      width: 32px;
      height: 32px;
      border-radius: 2px;
      background: #2A1F14;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #C8A96E;
      flex-shrink: 0;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6B5C3E;
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: #0D0D0D;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .kpi-sub { font-size: 12px; color: #A8967A; }

    /* ── Section Card ── */
    .section-card {
      background: #FFFFFF;
      border: 0.5px solid #E8E0D4;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .section-header {
      padding: 18px 22px 14px;
      border-bottom: 0.5px solid #E8E0D4;
    }
    .section-header h3 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 16px;
      font-weight: 700;
      color: #0D0D0D;
      margin: 0;
    }
    .section-header h3 i { color: #C8A96E; margin-right: 8px; }

    /* ── Table ── */
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      padding: 12px 16px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6B5C3E;
      font-weight: 600;
      background: #F8F5EF;
      text-align: left;
      border-bottom: 0.5px solid #E8E0D4;
    }
    .data-table td {
      padding: 14px 16px;
      font-size: 13px;
      color: #1A1512;
      border-bottom: 0.5px solid #F0EBE3;
    }
    .data-table tr:hover td { background: #FDFAF5; }
    .month-cell { font-weight: 600; color: #0D0D0D; }
    .month-cell i { color: #C8A96E; margin-right: 8px; }
    .orders-badge {
      background: #F0EBE3;
      color: #6B5C3E;
      padding: 3px 10px;
      border-radius: 2px;
      font-size: 12px;
      font-weight: 600;
    }
    .revenue-cell { font-weight: 600; color: #C8A96E; }
    .fee-cell { color: #791F1F; font-weight: 500; }
    .net-cell { font-weight: 700; color: #0D0D0D; }
    .total-row { background: #F8F5EF; }
    .total-row td { border-top: 0.5px solid #E8E0D4; font-size: 13px; }

    /* ── Payout List ── */
    .payout-list { padding: 8px 0; }
    .payout-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 22px; transition: background 0.15s;
    }
    .payout-item:not(:last-child) { border-bottom: 0.5px solid #F0EBE3; }
    .payout-item:hover { background: #FDFAF5; }
    .payout-left { display: flex; align-items: center; gap: 14px; }
    .payout-icon-wrap {
      width: 36px; height: 36px; border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    }
    .payout-icon-wrap.paid { background: #EAF3DE; color: #27500A; }
    .payout-icon-wrap.pending { background: #FAEEDA; color: #633806; }
    .payout-icon-wrap.processing { background: #E6F1FB; color: #0C447C; }
    .payout-info { display: flex; flex-direction: column; }
    .payout-ref { font-weight: 600; font-size: 13px; color: #0D0D0D; }
    .payout-date { font-size: 12px; color: #6B5C3E; }
    .payout-right { display: flex; align-items: center; gap: 16px; }
    .payout-amounts { display: flex; flex-direction: column; text-align: right; }
    .payout-amount { font-weight: 700; color: #0D0D0D; font-size: 14px; }
    .payout-fee { font-size: 11px; color: #6B5C3E; }
    .payout-status-badge {
      padding: 4px 12px; border-radius: 2px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    }
    [data-pstatus="paid"] { background: #EAF3DE; color: #27500A; }
    [data-pstatus="pending"] { background: #FAEEDA; color: #633806; }
    [data-pstatus="processing"] { background: #E6F1FB; color: #0C447C; }
    .empty-state { text-align: center; padding: 50px 20px; color: #6B5C3E; }
    .empty-state i { font-size: 2.5rem; opacity: 0.3; display: block; margin-bottom: 12px; }
    @media (max-width: 768px) {
      .earnings-header { flex-direction: column; gap: 12px; }
      .kpi-grid { grid-template-columns: 1fr; }
      .payout-item { flex-direction: column; align-items: flex-start; gap: 12px; }
      .payout-right { width: 100%; justify-content: space-between; }
    }
  `]
})
export class EarningsComponent implements OnInit {
  readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    this.seller.loadAll();
    this.seller.loadPayouts();
  }

  totalFees(): number {
    return +(this.seller.earnings() * 0.10).toFixed(2);
  }

  totalNet(): number {
    return +(this.seller.earnings() * 0.90).toFixed(2);
  }

  pendingPayout(): number {
    return this.seller.payouts()
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.net, 0);
  }

  totalOrders(): number {
    return this.seller.monthlyEarnings().reduce((s, m) => s + m.orders, 0);
  }

  formatMonth(month: string): string {
    if (!month || month === 'unknown') return 'Unknown';
    const [year, m] = month.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m, 10) - 1]} ${year}`;
  }

  requestPayout(): void {
    this.seller.requestPayout();
  }
}
