import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsComponent {}
