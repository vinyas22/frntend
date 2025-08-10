import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { BillsService } from '../../services/bills.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-create-monthly-salary',
  standalone: true,
  templateUrl: './create-monthly-salary.component.html',
  styleUrls: ['./create-monthly-salary.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, SharedModule]
})
export class CreateMonthlySalaryComponent {
  form = this.fb.group({
    title: ['', Validators.required],
    total_balance: [0, [Validators.required, Validators.min(1)]],
    bill_month: ['', Validators.required] // Example format: '2024-07'
  });

  error = '';
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private router: Router
  ) {}

 submit() {
  const { title, total_balance, bill_month } = this.form.value;
  if (!title || !total_balance || !bill_month) {
    this.error = 'Please fill all required fields.';
    return;
  }

  this.submitting = true;
  this.error = '';
  this.billsService.createMonthlySalary({
    title: title as string,
    total_balance: Number(total_balance),
    bill_month: bill_month as string
  }).subscribe({
    next: () => {
      this.submitting = false;
      this.router.navigate(['/dashboard/bills']);
    },
    error: err => {
      this.submitting = false;
      this.error = err?.error?.error || 'Failed to create salary!';
    }
  });
}

}
