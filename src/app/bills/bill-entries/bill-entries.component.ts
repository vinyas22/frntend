import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillsService } from '../../services/bills.service';
import { CommonModule } from '@angular/common';
// ✅ Removed NgIconsModule import

@Component({
  selector: 'app-bill-entries',
  standalone: true,
  imports: [CommonModule], // ✅ Removed NgIconsModule
  templateUrl: './bill-entries.component.html',
  styleUrls: ['./bill-entries.component.scss'],
})
export class BillEntriesComponent implements OnInit {
  billId!: number;
  entries: any[] = [];
  loading = true;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private billsService: BillsService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(+idParam) || +idParam <= 0) {
      this.loading = false;
      this.entries = [];
      this.errorMsg = 'Invalid bill selected.';
      return;
    }
    this.billId = +idParam;
    this.billsService.getBillEntries(this.billId).subscribe({
      next: (data) => { this.entries = data; this.loading = false; },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.errorMsg = 'Bill not found or not authorized.';
        } else {
          this.errorMsg = 'An error occurred while loading entries.';
        }
      }
    });
  }
}
