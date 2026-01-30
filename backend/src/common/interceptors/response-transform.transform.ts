import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    // The status code can be derived from the response or hard-coded as needed.
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        const success = statusCode >= HttpStatus.OK && statusCode < 300;

        // If data is already an object, add or overwrite status and message fields
        const transformedResponse = {
          success,
          message: this.getMessageFromStatus(statusCode),
          data,
        };

        return transformedResponse;
      }),
    );
  }

  private getMessageFromStatus(status: number): string {
    // You can customize messages based on the status code
    if (status >= HttpStatus.OK && status < 300) {
      return 'Success';
    } else if (status >= 400 && status < 500) {
      return 'Client error';
    } else if (status >= 500) {
      return 'Server error';
    }

    return 'Ok';
  }
}
