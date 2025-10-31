import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('currentUser');
    if (storedToken && storedUser) {
      this.accessToken = storedToken;
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  signUp(data: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data, { withCredentials: true }).pipe(
      tap(response => {
        if (response.ok && response.accessToken) {
          this.setSession(response.accessToken, response.user);
        }
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data, { withCredentials: true }).pipe(
      tap(response => {
        if (response.ok && response.accessToken) {
          this.setSession(response.accessToken, response.user);
        }
      })
    );
  }

  logout(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken && !!this.currentUserSubject.value;
  }

  private setSession(accessToken: string, user: User): void {
    this.accessToken = accessToken;
    this.currentUserSubject.next(user);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

