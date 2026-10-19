import { SetMetadata } from '@nestjs/common';

export const PERFIS = 'perfis';
export const Perfis = (...perfis: Array<'ADMIN' | 'CLIENTE'>) => SetMetadata(PERFIS, perfis);
