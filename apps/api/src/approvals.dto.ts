import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class ApprovalDecisionDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  decisionNote?: string;
}
