export interface SignUpDto {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  recaptcha: string;
}
