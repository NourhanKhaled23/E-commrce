import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirm = signal(false);
  registeredUser = signal<User | null>(null);
  modalOpen = signal(false);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[+]?[0-9\\s-]{7,20}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['customer', Validators.required]
    });
  }

  dismissModal(): void {
    this.modalOpen.set(false);
    this.router.navigate(['/products']);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }

    const { name, email, phone, password, confirmPassword, role } = this.registerForm.value;
    if (password !== confirmPassword) { this.errorMessage.set('Passwords do not match'); return; }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register({ name, email, phone: phone || '', password, role }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.registeredUser.set(user);
        this.modalOpen.set(true);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || err?.message || 'Registration failed');
      }
    });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
  toggleConfirm(): void { this.showConfirm.update(v => !v); }

  get f() { return this.registerForm.controls; }
}