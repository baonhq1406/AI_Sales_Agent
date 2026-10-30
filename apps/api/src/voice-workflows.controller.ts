import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { SaleAuthGuard } from './sale-auth.guard';
import {
  CloneVoiceRequestDto,
  SttRequestDto,
  TriggerWf01Dto,
  TriggerWf02Dto,
  TriggerWf03Dto,
  TriggerWf04Dto,
  TtsRequestDto,
} from './voice-workflows.dto';
import { VoiceWorkflowsService } from './voice-workflows.service';

@Controller('voice-workflows')
@UseGuards(ApiKeyGuard)
export class VoiceWorkflowsController {
  constructor(private readonly service: VoiceWorkflowsService) {}

  private getOrgId(req: any): string {
    return (
      req.saleUser?.organizationId ||
      process.env.DASHBOARD_ORGANIZATION_ID ||
      '11111111-1111-4111-8111-111111111111'
    );
  }

  @UseGuards(SaleAuthGuard)
  @Get('status')
  getStatus(@Request() req: { saleUser: { organizationId: string } }) {
    return this.service.getSystemStatus(this.getOrgId(req));
  }

  @Get('voices')
  listVoices() {
    return this.service.listVoiceProfiles();
  }

  @UseGuards(SaleAuthGuard)
  @Post('voices/clone')
  cloneVoice(@Body() dto: CloneVoiceRequestDto) {
    return this.service.cloneVoiceProfile(dto);
  }

  @UseGuards(SaleAuthGuard)
  @Delete('voices/:id')
  deleteVoice(@Param('id') id: string) {
    return this.service.deleteVoiceProfile(id);
  }

  @Post('stt')
  transcribe(@Body() dto: SttRequestDto) {
    return this.service.transcribeSpeech(dto);
  }

  @Post('tts')
  synthesize(@Body() dto: TtsRequestDto) {
    return this.service.synthesizeSpeech(dto);
  }

  @UseGuards(SaleAuthGuard)
  @Post('wf01/outbound-call')
  triggerWf01(
    @Body() dto: TriggerWf01Dto,
    @Request() req: { saleUser: { organizationId: string } },
  ) {
    return this.service.triggerWf01(dto, this.getOrgId(req));
  }

  @Post('wf02/inbound-call')
  triggerWf02(
    @Body() dto: TriggerWf02Dto,
    @Request() req: any,
  ) {
    return this.service.triggerWf02(dto, this.getOrgId(req));
  }

  @UseGuards(SaleAuthGuard)
  @Post('wf03/orchestrate')
  triggerWf03(
    @Body() dto: TriggerWf03Dto,
    @Request() req: { saleUser: { organizationId: string } },
  ) {
    return this.service.triggerWf03(dto, this.getOrgId(req));
  }

  @Post('wf04/agentic-request')
  triggerWf04(
    @Body() dto: TriggerWf04Dto,
    @Request() req: any,
  ) {
    return this.service.triggerWf04(dto, this.getOrgId(req));
  }
}
