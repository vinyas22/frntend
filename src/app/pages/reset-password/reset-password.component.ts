import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./reset-password.component.scss'],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);

  resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  identifier: string = '';
  resetToken: string = '';
  error: string | null = null;
  message: string | null = null;

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.identifier = nav?.extras.state?.['identifier'] ?? this.auth.getPasswordResetIdentifier();
    this.resetToken = nav?.extras.state?.['resetToken'] ?? this.auth.getPasswordResetToken();
    if (!this.identifier || !this.resetToken) {
      this.error = 'Please start from "Forgot Password".';
    }
  }

  onSubmit() {
    this.error = this.message = null;
    if (this.resetForm.invalid || !this.identifier || !this.resetToken) return;
    const newPassword = this.resetForm.value.newPassword ?? '';
    this.auth.resetPassword({
      identifier: this.identifier,
      resetToken: this.resetToken,
      newPassword
    }).subscribe({
      next: (res) => {
        this.auth.clearPasswordResetState();
        this.message = res.message || 'Password reset successful! Please log in.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to reset password.';
      }
    });
  }
}
