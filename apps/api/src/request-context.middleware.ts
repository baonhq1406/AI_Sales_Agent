import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
export function requestContextMiddleware(req:Request,res:Response,next:NextFunction) {
  const requestId=req.header('x-request-id')??randomUUID();
  const correlationId=req.header('x-correlation-id')??randomUUID();
  res.setHeader('x-request-id',requestId); res.setHeader('x-correlation-id',correlationId);
  (req as Request & {requestId?:string;correlationId?:string}).requestId=requestId;
  (req as Request & {requestId?:string;correlationId?:string}).correlationId=correlationId;
  next();
}
