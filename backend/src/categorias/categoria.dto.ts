import { IsNotEmpty, IsString } from 'class-validator';

export class CriarCategoriaDto {
  @IsString() @IsNotEmpty() nome!: string;
}
