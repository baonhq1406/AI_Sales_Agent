import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const KNOWLEDGE_CATEGORIES = [
  'product',
  'policy',
  'faq',
  'pricing',
  'general',
] as const;

export class AskKnowledgeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  query!: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_CATEGORIES)
  category?: (typeof KNOWLEDGE_CATEGORIES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  topK?: number;
}
