import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resend-verification',
  standalone: true,
  styleUrls: ['./resend-verification.component.scss'],
  templateUrl: './resend-verification.component.html',
  imports: [ReactiveFormsModule, CommonModule],
})
export class ResendVerificationComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);

  error: string | null = null;
  message: string | null = null;

  resendForm = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
});


  onResend() {
    this.error = this.message = null;
    if (this.resendForm.invalid) return;
    this.auth.resendVerification(this.resendForm.getRawValue()).subscribe({
      next: res => this.message = res.message || 'Verification email sent.',
      error: err => this.error = err?.error?.error || 'Failed to resend verification.',
    });
  }
}
