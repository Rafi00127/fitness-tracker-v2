import { IsEmail, IsString, Length } from 'class-validator';

export class LoginAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 72)
  password: string;
}
