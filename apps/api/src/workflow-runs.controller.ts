import {Controller,Get,Param,UseGuards} from '@nestjs/common'; import {ApiKeyGuard} from './api-key.guard'; import {WorkflowRunsService} from './workflow-runs.service';
@Controller('workflow-runs') @UseGuards(ApiKeyGuard) export class WorkflowRunsController {constructor(private readonly s:WorkflowRunsService){} @Get(':id') find(@Param('id') id:string){return this.s.findById(id)}}
