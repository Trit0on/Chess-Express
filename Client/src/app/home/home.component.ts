import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="home-content">
        <h1>Bienvenue sur Chess Express!</h1>
        <div *ngIf="currentUser" class="user-info">
          <h2>Bonjour, {{ currentUser.name || currentUser.email }}!</h2>
          <p>Email: {{ currentUser.email }}</p>
          <button (click)="logout()" class="btn-logout">Se déconnecter</button>
        </div>
        <div *ngIf="!currentUser">
          <p>Chargement...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .home-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 60px 40px;
      text-align: center;
      max-width: 600px;

      h1 {
        font-size: 32px;
        color: #333;
        margin-bottom: 30px;
      }

      h2 {
        font-size: 24px;
        color: #667eea;
        margin-bottom: 15px;
      }

      p {
        color: #666;
        margin-bottom: 30px;
      }
    }

    .user-info {
      margin-top: 30px;
    }

    .btn-logout {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(239, 68, 68, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/signin']);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}

