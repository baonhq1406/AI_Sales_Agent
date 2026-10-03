import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CreateLeadDto, UpdateLeadDto } from './leads.dto';
@Injectable()
export class LeadsService {
 constructor(private readonly db:DatabaseService){}
 async createOrUpsert(dto:CreateLeadDto){
  try{const r=await this.db.query('INSERT INTO leads (organization_id,external_source,external_id,first_name,last_name,company_name,email,phone,source,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (organization_id,external_source,external_id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,company_name=EXCLUDED.company_name,email=EXCLUDED.email,phone=EXCLUDED.phone,source=EXCLUDED.source,metadata=EXCLUDED.metadata,updated_at=NOW() RETURNING *',[dto.organizationId,dto.externalSource??null,dto.externalId??null,dto.firstName??null,dto.lastName??null,dto.companyName??null,dto.email??null,dto.phone??null,dto.source??null,dto.metadata??{}]);return r.rows[0];}
  catch(e){const c=(e as {code?:string}).code;if(c==='23503'||c==='23505')throw new ConflictException('Lead conflicts with organization or existing record');throw e;}
 }
 async findById(id:string){const r=await this.db.query('SELECT * FROM leads WHERE id=$1',[id]);if(!r.rowCount)throw new NotFoundException('Lead not found');return r.rows[0];}
 async update(id:string,dto:UpdateLeadDto){
  const m:Record<string,unknown>={first_name:dto.firstName,last_name:dto.lastName,company_name:dto.companyName,email:dto.email,phone:dto.phone,source:dto.source,status:dto.status,score:dto.score,metadata:dto.metadata};
  const e=Object.entries(m).filter(([,v])=>v!==undefined);if(!e.length)return this.findById(id);
  const set=e.map(([k],i)=>k+'=$'+(i+2)).join(',');
  const r=await this.db.query('UPDATE leads SET '+set+',updated_at=NOW() WHERE id=$1 RETURNING *',[id,...e.map(([,v])=>v)]);
  if(!r.rowCount)throw new NotFoundException('Lead not found');return r.rows[0];
 }
}
