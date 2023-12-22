import { fireToast } from './fire-toast.function';

type FunctionType = <T extends { name: string }>(
  payload: T,
  entityName: string,
  participle:
    | 'atualizado'
    | 'criado'
    | 'deletado'
    | 'criada'
    | 'atualizada'
    | 'deletada'
) => void;

export const fireGenericSuccess: FunctionType = (
  payload,
  entityName: string,
  participle:
    | 'atualizado'
    | 'criado'
    | 'deletado'
    | 'criada'
    | 'atualizada'
    | 'deletada'
) => {
  fireToast(
    'Sucesso 😉',
    `${entityName} ${payload.name} foi ${participle} com sucesso!`,
    'success'
  );
};
