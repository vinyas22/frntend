import { Component, OnInit } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.billsService.getBills().subscribe(bills => this.bills = bills);
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
