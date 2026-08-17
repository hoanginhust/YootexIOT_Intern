import { Module } from '@nestjs/common';
import { VegetableService } from './vegetable.service';
import { VegetableController } from './vegetable.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VegetableController],
  providers: [VegetableService],
  exports: [VegetableService],
})
export class VegetableModule {}