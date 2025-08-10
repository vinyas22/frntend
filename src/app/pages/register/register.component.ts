import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls : ['./register.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);

  error: string | null = null;
  message: string | null = null;
  loading = false;

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onRegister() {
    this.error = this.message = null;
    if (this.registerForm.invalid) return;
    this.loading = true;
    const { name, email, password } = this.registerForm.value!;
    this.auth.register(name!, email!, password!).subscribe({
      next: () => {
        this.message = "Verification email sent. Please check your inbox.";
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error || 'Registration failed.';
        this.loading = false;
      }
    });
  }
}
