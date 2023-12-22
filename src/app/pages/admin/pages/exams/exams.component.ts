import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './exams.component.html',
  styleUrl: './exams.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamsComponent {}
