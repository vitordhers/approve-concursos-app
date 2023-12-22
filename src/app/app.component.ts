import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RecaptchaBadgeService } from './services/recaptcha-badge.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
})
export class AppComponent implements OnInit {
  title = 'questions-app';

  constructor(private recaptchaBadgeService: RecaptchaBadgeService) {}

  ngOnInit(): void {
    this.recaptchaBadgeService.hideBadge();
  }
}
