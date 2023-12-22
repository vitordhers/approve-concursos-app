import { SweetAlertIcon } from 'sweetalert2';
import { toastMixin } from '../constants/toast-mixin.const';

export const fireToast = (
  title?: string,
  html?: string,
  icon?: SweetAlertIcon
) => {
  toastMixin.fire(title, html, icon);
};
