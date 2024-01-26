export interface AuthDialogData {
  initialTabIndex: number;
  verifyToken?: string;
  resendConfirmationTo?: string;
  recoverPasswordEmail?: string;
  redefinePasswordToken?: string | null;
}
