import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubjectsComponent {}
