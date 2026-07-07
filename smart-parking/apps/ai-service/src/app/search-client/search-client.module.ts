import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchClientService } from './search-client.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
    imports: [HttpModule.register({ timeout: 2000 }), MetricsModule],
    providers: [SearchClientService],
    exports: [SearchClientService],
})
export class SearchClientModule { }