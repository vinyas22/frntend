import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnInit {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);

  otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  identifier: string = '';
  error: string | null = null;

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.identifier = nav?.extras.state?.['identifier'] ?? this.auth.getPasswordResetIdentifier();
    if (!this.identifier) this.error = 'Please start from "Forgot Password".';
  }

  onSubmit() {
    this.error = null;
    if (this.otpForm.invalid || !this.identifier) return;
    const otp = this.otpForm.value.otp ?? '';
    this.auth.verifyResetOtp({ identifier: this.identifier, otp }).subscribe({
      next: (res) => {
        this.auth.setPasswordResetToken(res.resetToken ?? '');
        this.auth.setPasswordResetIdentifier(this.identifier); // keep for reloads in next step
        this.router.navigate(['/reset-password'], {
          state: {
            identifier: this.identifier,
            resetToken: res.resetToken ?? ''
          }
        });
      },
      error: (err) => {
        this.error = err?.error?.error || 'Invalid or expired OTP.';
      }
    });
  }
}
