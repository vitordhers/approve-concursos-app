import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent implements OnInit {
  @Input() fontSize = 72;
  sizeBig = '72px';
  sizeSmall = '60px';

  private smallBigratio = 60 / 72;

  ngOnInit(): void {
    if (this.fontSize === 72) return;
    // 2rem * 16px = 32px
    this.sizeSmall = `${this.smallBigratio * this.fontSize}px`;
  }
}
