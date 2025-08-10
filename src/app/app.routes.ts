import { Routes } from '@angular/router';

// ----------- AUTH PAGES (Always use .component suffix!) -----------
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { ResendVerificationComponent } from './pages/resend-verification/resend-verification.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './pages/verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

// ----------- DASHBOARD PAGES -----------
import { AuthGuard } from './shared/auth.guard';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { DashboardHomeComponent } from './layout/dashboard/dashboard-home.component';
import { BillsComponent } from './bills/bills.component';
import { BillEntriesComponent } from './bills/bill-entries/bill-entries.component';
import { EntriesAddComponent } from './entries-add/entries-add.component';
import { CreateMonthlySalaryComponent } from './bills/create-monthly-salary/create-monthly-salary.component';
import { UpdateBalanceComponent } from './bills/update-balance/update-balance.component';
import { LayoutComponent } from './layout/layout.component';
// ----------- REPORTS -----------
import { WeeklyReportComponent } from './reports/weekly-report/weekly-report.component';
import { MonthlyReportComponent } from './reports/monthly-report/monthly-report.component';
import { QuarterlyReportComponent } from './reports/quarterly-report/quarterly-report.component';
import { YearlyReportComponent } from './reports/yearly-report/yearly-report.component';

// ---------- ROUTES ----------
export const routes: Routes = [
  // ---------- AUTH ROUTES ----------
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify', component: VerifyEmailComponent },
  { path: 'resend-verification', component: ResendVerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ---------- DASHBOARD (Protected) ----------
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'bills', component: BillsComponent },
      { path: 'bills/:id/entries', component: BillEntriesComponent },
      { path: 'bills/add', component: CreateMonthlySalaryComponent },
      { path: 'bills/update-balance', component: UpdateBalanceComponent },
      { path: 'entries-add', component: EntriesAddComponent },
      // ...add additional children as needed
    ]
  },

  // ---------- REPORTS (Flat) ----------
  { path: 'reports/weekly', component: WeeklyReportComponent },
  { path: 'reports/monthly', component: MonthlyReportComponent },
  { path: 'reports/quarterly', component: QuarterlyReportComponent },
  { path: 'reports/yearly', component: YearlyReportComponent },

  // --- Redirect /reports to /reports/weekly ---
  { path: 'reports', redirectTo: 'reports/weekly', pathMatch: 'full' },

  // --- Legacy alias redirects for backward compatibility ---
  { path: 'weekly-report', redirectTo: 'reports/weekly', pathMatch: 'full' },
  { path: 'monthly-report', redirectTo: 'reports/monthly', pathMatch: 'full' },
  { path: 'quarterly-report', redirectTo: 'reports/quarterly', pathMatch: 'full' },
  { path: 'yearly-report', redirectTo: 'reports/yearly', pathMatch: 'full' },

  // ---------- DEFAULTS AND 404 (Always last!) ----------
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
