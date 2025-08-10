import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PercentagePipe } from './pipes/percentage.pipe';

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, PercentagePipe],
  templateUrl: `./period-selector.component.html`
})
export class PeriodSelectorComponent implements OnInit {
  @Input() periods: any[] = [];
  @Input() selectedPeriod: string = '';
  @Input() periodType: string = 'period';
  @Input() loading: boolean = false;
  
  @Output() periodSelected = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();

  ngOnInit() {
    // Auto-select first period if none selected
    if (!this.selectedPeriod && this.periods.length > 0) {
      this.selectedPeriod = this.periods[0].value;
      this.onPeriodChange(this.selectedPeriod);
    }
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.periodSelected.emit(period);
  }

  onRefresh(): void {
    this.refresh.emit();
  }
}
