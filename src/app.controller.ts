import { Controller, Get } from '@nestjs/common';

@Controller('app')
export class AppController {
  constructor() {}

  @Get('test')
  test(): string {
    return 'Hello World!';
  }
}
