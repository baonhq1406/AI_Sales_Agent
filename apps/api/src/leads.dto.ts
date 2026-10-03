import { IsEmail, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
export class CreateLeadDto {
 @IsUUID() organizationId!:string;
 @IsOptional() @IsString() externalSource?:string;
 @IsOptional() @IsString() externalId?:string;
 @IsOptional() @IsString() firstName?:string;
 @IsOptional() @IsString() lastName?:string;
 @IsOptional() @IsString() companyName?:string;
 @IsOptional() @IsEmail() email?:string;
 @IsOptional() @IsString() phone?:string;
 @IsOptional() @IsString() source?:string;
 @IsOptional() @IsObject() metadata?:Record<string,unknown>;
}
export class UpdateLeadDto {
 @IsOptional() @IsString() firstName?:string;
 @IsOptional() @IsString() lastName?:string;
 @IsOptional() @IsString() companyName?:string;
 @IsOptional() @IsEmail() email?:string;
 @IsOptional() @IsString() phone?:string;
 @IsOptional() @IsString() source?:string;
 @IsOptional() @IsString() status?:string;
 @IsOptional() @IsNumber() @Min(0) @Max(100) score?:number;
 @IsOptional() @IsObject() metadata?:Record<string,unknown>;
}
