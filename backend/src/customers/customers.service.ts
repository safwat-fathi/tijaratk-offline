import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return this.customersRepository.find();
  }

  async findOne(id: number): Promise<Customer | null> {
    return this.customersRepository.findOne({ where: { id } });
  }

  async findOrCreate(
    phone: string,
    tenantId: number,
    name?: string,
    address?: string,
    manager?: EntityManager,
  ): Promise<Customer> {
    const repo = manager ? manager.getRepository(Customer) : this.customersRepository;
    
    let customer = await repo.findOne({
      where: { phone, tenant_id: tenantId },
    });

    if (!customer) {
      customer = repo.create({
        phone,
        tenant_id: tenantId,
        name,
        address,
      });
      return repo.save(customer);
    } 
    
    // Optional: update name/address if provided and currently empty?
    // For now, keep it simple: return existing.
    // Actually, updating address might be good if it's new.
    // But let's stick to the plan: "If exists -> reuse".
    
    return customer;
  }
}
