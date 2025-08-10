import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WeeklyReportComponent } from './weekly-report/weekly-report.component';
import { MonthlyReportComponent } from './monthly-report/monthly-report.component';
import { QuarterlyReportComponent } from './quarterly-report/quarterly-report.component';
import { YearlyReportComponent } from './yearly-report/yearly-report.component';

const routes: Routes = [
  { path: '', redirectTo: 'weekly', pathMatch: 'full' },
  { path: 'weekly', component: WeeklyReportComponent },
  { path: 'monthly', component: MonthlyReportComponent },
  { path: 'quarterly', component: QuarterlyReportComponent },
  { path: 'yearly', component: YearlyReportComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
