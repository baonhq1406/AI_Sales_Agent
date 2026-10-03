import { IsObject, IsString, IsUUID } from 'class-validator';
export class CreateEventDto { @IsString() eventName!:string; @IsString() aggregateType!:string; @IsUUID() aggregateId!:string; @IsUUID() organizationId!:string; @IsUUID() correlationId!:string; @IsObject() payload!:Record<string,unknown>; }
