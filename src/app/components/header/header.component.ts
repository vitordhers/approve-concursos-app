import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../services/user/user.service';
import { ModalService } from '../../services/modal.service';
import { AuthComponent } from '../modals/auth/auth.component';
import { DialogData } from '../modals/auth/interface/dialog-data.interface';
import { fireToast } from '../../notification/functions/fire-toast.function';
import { LogoComponent } from '../logo/logo.component';
import { RouterModule } from '@angular/router';

@Component({
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    FontAwesomeModule,
    RouterModule,
    LogoComponent
  ],
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  faHome = faHome;

  @Output() toggleHeader = new EventEmitter<void>();

  constructor(
    public userService: UserService,
    private modalService: ModalService
  ) {}

  openAuth() {
    if (this.userService.isLoggedIn()) {
      fireToast('Atenção', 'você já está logado 😉', 'success');
      return;
    }
    this.modalService.openModal<AuthComponent, DialogData, void>(
      AuthComponent,
      { initialTabIndex: 1 }
    );
  }

  onSideNavButtonClick() {
    this.toggleHeader.next();
  }
}
