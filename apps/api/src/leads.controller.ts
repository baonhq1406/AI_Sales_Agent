import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard'; import { CreateLeadDto,UpdateLeadDto } from './leads.dto'; import { LeadsService } from './leads.service';
@Controller('leads') @UseGuards(ApiKeyGuard)
export class LeadsController { constructor(private readonly s:LeadsService){} @Post() create(@Body() d:CreateLeadDto){return this.s.createOrUpsert(d)} @Get(':id') find(@Param('id') id:string){return this.s.findById(id)} @Patch(':id') update(@Param('id') id:string,@Body() d:UpdateLeadDto){return this.s.update(id,d)} }
