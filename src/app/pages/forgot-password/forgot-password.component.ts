import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./forgot-password.component.scss'],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);

  forgotForm = this.fb.nonNullable.group({
    identifier: ['', Validators.required]
  });

  error: string | null = null;

  onSubmit() {
    this.error = null;
    if (this.forgotForm.invalid) return;
    const identifier = this.forgotForm.value.identifier ?? '';
    this.auth.requestPasswordOtp({ identifier }).subscribe({
      next: () => {
        this.auth.setPasswordResetIdentifier(identifier);
        this.router.navigate(['/verify-otp'], { state: { identifier } });
      },
      error: (err) => {
        this.error = err?.error?.error || 'Could not send OTP';
      }
    });
  }
}
