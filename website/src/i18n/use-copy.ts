import { useContext } from 'react';
import { I18nContext } from './context';

export function useCopy() {
  return useContext(I18nContext);
}
