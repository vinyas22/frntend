import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';

import { ReportsRoutingModule } from './reports-routing.module';
import { SharedModule } from '../shared/shared.module';

//  
import { WeeklyReportComponent } from './weekly-report/weekly-report.component';
import { MonthlyReportComponent } from './monthly-report/monthly-report.component';
import { QuarterlyReportComponent } from './quarterly-report/quarterly-report.component';
import { YearlyReportComponent } from './yearly-report/yearly-report.component';
import { SummaryCardComponent } from './summary-card.component';
import { PeriodSelectorComponent } from './period-selector.component';
import { NotificationBellComponent } from '../notifications/notification-bell/notification-bell.component';
import { NotificationToastComponent } from '../notifications/notification-toast/notification-toast.component';

// Pipes
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReportsRoutingModule,
    SharedModule,
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
    
    // Standalone Components
    WeeklyReportComponent,
    MonthlyReportComponent,
    QuarterlyReportComponent,
    YearlyReportComponent,
    SummaryCardComponent,
    PeriodSelectorComponent,
    NotificationBellComponent,
    NotificationToastComponent,
    
    // Pipes
    CurrencyFormatPipe,
    PercentagePipe
  ],
  exports: [
    NotificationBellComponent,
    NotificationToastComponent
  ]
})
export class ReportsModule { }
