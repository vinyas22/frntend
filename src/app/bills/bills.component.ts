import { Component, OnInit } from '@angular/core';
import { BillsService } from '../services/bills.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss'],
})
export class BillsComponent implements OnInit {
  bills: any[] = [];
  loading = true;
  constructor(private billsService: BillsService) {}

  ngOnInit() {
    this.billsService.getBills().subscribe({
      next: (data) => { this.bills = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
