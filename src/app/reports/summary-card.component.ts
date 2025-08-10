import { Component, Input } from '@angular/core';
import  { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';
@Component({
  selector: 'app-summary-card',
  standalone: true,
  templateUrl: `./summary-card.component.html`,
    imports: [CommonModule, CurrencyFormatPipe, PercentagePipe],
  
})
export class SummaryCardComponent {
  @Input() title!: string;
  @Input() value!: number;
  @Input() comparison?: number;
  @Input() comparisonText: string = ' vs last period';
  @Input() type: 'income' | 'expense' | 'savings' | 'default' = 'default';

  get valueClass(): string {
    switch (this.type) {
      case 'income': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'savings': return 'text-blue-600';
      default: return 'text-gray-900 dark:text-white';
    }
  }

  get iconBgClass(): string {
    switch (this.type) {
      case 'income': return 'bg-green-100 dark:bg-green-900';
      case 'expense': return 'bg-red-100 dark:bg-red-900';
      case 'savings': return 'bg-blue-100 dark:bg-blue-900';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  }
}
