import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-institutions',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './institutions.component.html',
  styleUrl: './institutions.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstitutionsComponent {}
