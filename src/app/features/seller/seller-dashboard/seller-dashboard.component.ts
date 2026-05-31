import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SellerService } from '../../../core/services/seller.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.scss']
})
export class SellerDashboardComponent implements OnInit {
  readonly seller = inject(SellerService);

  ngOnInit(): void {
    this.seller.loadAll();
    this.seller.loadSellerProfile();
  }
}
