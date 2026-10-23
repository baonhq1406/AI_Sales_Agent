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
@UseGuards(ApiKeyGuard, SaleAuthGuard)
export class VoiceWorkflowsController {
  constructor(private readonly service: VoiceWorkflowsService) {}

  @Get('status')
  getStatus(@Request() req: { saleUser: { organizationId: string } }) {
    return this.service.getSystemStatus(req.saleUser.organizationId);
  }

  @Get('voices')
  listVoices() {
    return this.service.listVoiceProfiles();
  }

  @Post('voices/clone')
  cloneVoice(@Body() dto: CloneVoiceRequestDto) {
    return this.service.cloneVoiceProfile(dto);
  }

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

  @Post('wf01/outbound-call')
  triggerWf01(
    @Body() dto: TriggerWf01Dto,
    @Request() req: { saleUser: { organizationId: string } },
  ) {
    return this.service.triggerWf01(dto, req.saleUser.organizationId);
  }

  @Post('wf02/inbound-call')
  triggerWf02(
    @Body() dto: TriggerWf02Dto,
    @Request() req: { saleUser: { organizationId: string } },
  ) {
    return this.service.triggerWf02(dto, req.saleUser.organizationId);
  }

  @Post('wf03/orchestrate')
  triggerWf03(
    @Body() dto: TriggerWf03Dto,
    @Request() req: { saleUser: { organizationId: string } },
  ) {
    return this.service.triggerWf03(dto, req.saleUser.organizationId);
  }

  @Post('wf04/agentic-request')
  triggerWf04(
    @Body() dto: TriggerWf04Dto,
    @Request() req: { saleUser: { organizationId: string } },
  ) {
    return this.service.triggerWf04(dto, req.saleUser.organizationId);
  }
}
