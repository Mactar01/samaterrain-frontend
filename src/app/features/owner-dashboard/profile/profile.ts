import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: [''],
      current_password: [''],
      new_password: ['', [Validators.minLength(8)]],
      new_password_confirmation: ['']
    });

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone || ''
        });
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    const formValues = this.profileForm.value;
    const data: any = {
      name: formValues.name,
      phone: formValues.phone
    };

    if (formValues.new_password) {
      if (formValues.new_password !== formValues.new_password_confirmation) {
        this.confirmationService.toast('Les mots de passe ne correspondent pas.', 'error');
        return;
      }
      if (!formValues.current_password) {
        this.confirmationService.toast('Le mot de passe actuel est requis pour le modifier.', 'error');
        return;
      }
      data.current_password = formValues.current_password;
      data.new_password = formValues.new_password;
      data.new_password_confirmation = formValues.new_password_confirmation;
    }

    this.isLoading = true;
    this.authService.updateProfile(data).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.confirmationService.toast('Profil mis à jour avec succès !', 'success');
        this.profileForm.patchValue({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      },
      error: (err) => {
        this.isLoading = false;
        let errMsg = err.error?.message || 'Erreur lors de la mise à jour du profil.';
        if (err.error?.errors) {
          const firstError = Object.values(err.error.errors)[0] as string[];
          if (firstError && firstError.length > 0) {
            errMsg = firstError[0];
          }
        }
        this.confirmationService.error(errMsg);
      }
    });
  }
}
