import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { BillsService } from '../../services/bills.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-balance',
  standalone: true,
  templateUrl: './update-balance.component.html',
  styleUrls: ['./update-balance.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class UpdateBalanceComponent implements OnInit {
  form = this.fb.group({
    billId: [null, Validators.required],
    total_balance: [0, [Validators.required, Validators.min(1)]]
  });

  bills: any[] = [];
  error = '';
  submitting = false;

  dropdownOpen = false;
  selectedBill: any = null;

  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.billsService.getBills().subscribe(bills => {
      this.bills = bills;
      const currentBillId = this.form.get('billId')?.value;
      this.selectedBill = this.bills.find(b => b.id === currentBillId) || null;
    });

    this.form.get('billId')?.valueChanges.subscribe(billId => {
      this.selectedBill = this.bills.find(b => b.id === billId) || null;
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectBill(bill: any) {
    this.selectedBill = bill;
    this.form.get('billId')?.setValue(bill.id);
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.dropdownOpen = false;
    }
  }

  submit() {
    const { billId, total_balance } = this.form.value;
    if (!billId || !total_balance || this.form.invalid) {
      this.error = 'Please fill all required fields.';
      return;
    }

    this.submitting = true;
    this.error = '';
    this.billsService.updateTotalBalance(Number(billId), total_balance).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/dashboard/bills']);
      },
      error: err => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to update balance!';
      }
    });
  }
}
