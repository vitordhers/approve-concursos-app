import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './users.component.html',
  styleUrl: './users.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {}
