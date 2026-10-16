import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  let headers: any = {
    'Bypass-Tunnel-Reminder': 'true'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const clonedRequest = req.clone({
    setHeaders: headers
  });

  return next(clonedRequest).pipe(
    catchError((error: any) => {
      // Si le backend renvoie 200-299 mais qu'Angular a échoué à parser le JSON
      // à cause d'un warning/notice PHP (ex: "Notice: PHP Request Startup...")
      if (error instanceof HttpErrorResponse && error.status >= 200 && error.status < 300) {
        const rawText = typeof error.error === 'string' ? error.error : error.error?.text;
        if (typeof rawText === 'string') {
          const startObj = rawText.indexOf('{');
          const startArr = rawText.indexOf('[');
          const start = (startObj !== -1 && startArr !== -1)
            ? Math.min(startObj, startArr)
            : (startObj !== -1 ? startObj : startArr);

          if (start !== -1) {
            try {
              const cleanData = JSON.parse(rawText.substring(start));
              return of(new HttpResponse({
                body: cleanData,
                headers: error.headers,
                status: error.status,
                statusText: error.statusText,
                url: error.url || undefined
              }));
            } catch {
              // Ignore si le parsing échoue
            }
          }
        }
      }

      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

