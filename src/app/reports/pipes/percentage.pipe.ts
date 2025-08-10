import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentage',
  standalone: true
})
export class PercentagePipe implements PipeTransform {
  transform(value: number | null | undefined, decimalPlaces: number = 1): string {
    if (value === null || value === undefined) return '0%';
    
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimalPlaces)}%`;
  }
}
