import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // If the request URL starts with a slash, it's an API request
  // so we prepend the environment apiUrl.
  if (req.url.startsWith('/')) {
    const apiReq = req.clone({
      url: `${environment.apiUrl}${req.url}`
    });
    return next(apiReq);
  }
  
  // Otherwise, pass it through unchanged
  return next(req);
};
