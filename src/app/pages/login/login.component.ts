import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  error: string | null = null;
  loading = false;

  loginForm = this.fb.nonNullable.group({
    identifier: ['', Validators.required],   // email or username!
    password: ['', Validators.required]
  });

  onSubmit() {
    this.error = null;
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (res: any) => {
        this.authService.setToken(res.token);
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login failed.';
        this.loading = false;
      }
    });
  }
}
