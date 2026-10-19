import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() senha!: string;
}

export class RegistrarDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) senha!: string;
}
