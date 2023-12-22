import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './boards.component.html',
  styleUrl: './boards.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardsComponent {

}
