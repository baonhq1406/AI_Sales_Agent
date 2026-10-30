import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SttRequestDto {
  @IsString()
  audio_base64!: string;

  @IsOptional()
  @IsString()
  mime_type?: string;
}

export class TtsRequestDto {
  @IsString()
  @MaxLength(4000)
  text!: string;

  @IsOptional()
  @IsString()
  voice_id?: string;
}

export class CloneVoiceRequestDto {
  @IsString()
  @MaxLength(120)
  display_name!: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reference_text?: string;

  @IsOptional()
  @IsString()
  audio_base64?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;
}

export class TriggerWf01Dto {
  @IsOptional()
  @IsString()
  lead_id?: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  customer_speech?: string;

  @IsOptional()
  @IsString()
  voice_id?: string;

  @IsOptional()
  @IsString()
  scenario?: string;
}

export class TriggerWf02Dto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  caller_name?: string;

  @IsOptional()
  @IsString()
  speech?: string;

  @IsOptional()
  @IsString()
  customer_speech?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  voice_id?: string;

  @IsOptional()
  @IsString()
  scenario?: string;
}

export class TriggerWf03Dto {
  @IsOptional()
  @IsString()
  scenario_id?: string;

  @IsOptional()
  @IsString()
  lead_id?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  intent?: string;

  @IsOptional()
  @IsString()
  sentiment?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  customer_query?: string;

  @IsOptional()
  lead_score?: any;
}

export class TriggerWf04Dto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  input?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  task?: string;

  @IsOptional()
  @IsString()
  task_type?: string;

  @IsOptional()
  @IsString()
  lead_id?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
