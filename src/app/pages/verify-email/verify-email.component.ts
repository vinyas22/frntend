import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit {
  verifying = true;
  success = false;
  error: string | null = null;
  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.verifying = false;
      this.error = 'Invalid or missing token';
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.success = true;
        this.verifying = false;
      },
      error: () => {
        this.error = 'Verification link expired or invalid.';
        this.verifying = false;
      }
    });
  }
}
