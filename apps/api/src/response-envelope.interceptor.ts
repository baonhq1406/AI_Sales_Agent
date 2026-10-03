import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { map, Observable } from 'rxjs';
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context:ExecutionContext,next:CallHandler):Observable<unknown> {
    const req=context.switchToHttp().getRequest<Request & {requestId?:string;correlationId?:string}>();
    return next.handle().pipe(map(data=>({data,meta:{requestId:req.requestId,correlationId:req.correlationId}})));
  }
}
