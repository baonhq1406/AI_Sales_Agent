import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception:unknown,host:ArgumentsHost) {
    const res=host.switchToHttp().getResponse<Response>();
    const req=host.switchToHttp().getRequest<Request & {requestId?:string;correlationId?:string}>();
    const status=exception instanceof HttpException?exception.getStatus():HttpStatus.INTERNAL_SERVER_ERROR;
    const body=exception instanceof HttpException?exception.getResponse():null;
    const message=typeof body==='string'?body:typeof body==='object'&&body&&'message' in body?(body as {message:string|string[]}).message:'Internal server error';
    res.status(status).json({error:{code:status>=500?'INTERNAL_SERVER_ERROR':'HTTP_'+status,message},meta:{requestId:req.requestId,correlationId:req.correlationId}});
  }
}
