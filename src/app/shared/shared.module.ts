import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxEchartsModule } from 'ngx-echarts';
// ✅ Import NgIconsModule and icons you want to use
import { NgIconsModule } from '@ng-icons/core';
import { HeroHome, HeroDocumentText, HeroChartPie, HeroBell } from '@ng-icons/heroicons/outline';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgxEchartsModule,
   
    HttpClientModule,
    // ✅ Register icons here globally
    NgIconsModule.withIcons({ HeroHome, HeroDocumentText, HeroChartPie, HeroBell })
  ],
  exports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    // ✅ Export NgIconsModule so other components can use <ng-icon>
    NgIconsModule
  ]
})
export class SharedModule {}
