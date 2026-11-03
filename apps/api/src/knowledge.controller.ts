import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { AskKnowledgeDto } from './knowledge.dto';
import { KnowledgeService } from './knowledge.service';
import { SaleAuthGuard } from './sale-auth.guard';

type KnowledgeRequest = {
  saleUser: {
    organizationId: string;
  };
};

@Controller('knowledge')
@UseGuards(ApiKeyGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @UseGuards(SaleAuthGuard)
  @Get('documents')
  listDocuments(@Request() req: KnowledgeRequest) {
    return this.knowledge.listDocuments(req.saleUser.organizationId);
  }

  @UseGuards(SaleAuthGuard)
  @Post('ask')
  ask(@Body() dto: AskKnowledgeDto, @Request() req: KnowledgeRequest) {
    return this.knowledge.ask(req.saleUser.organizationId, dto);
  }
}
