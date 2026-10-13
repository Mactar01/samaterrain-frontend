import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FieldService } from '../../../core/services/field.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-create-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-field.html',
  styleUrl: './create-field.scss'
})
export class CreateFieldComponent {
  private fieldService = inject(FieldService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);

  field = {
    name: '',
    type: 'artificial_grass',
    city: '',
    address: '',
    price_per_hour: 0,
    capacity: 10,
    currency: 'FCFA',
    is_active: true
  };

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;
  errorMessage = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    this.isSubmitting = true;
    this.errorMessage = '';
    
    // Use FormData for file upload
    const formData = new FormData();
    Object.keys(this.field).forEach(key => {
      let value = (this.field as any)[key];
      // Laravel boolean validation accepts 1/0, but fails on "true"/"false" strings
      if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      }
      formData.append(key, value);
    });
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    
    this.fieldService.createField(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.confirmationService.toast("Terrain ajouté avec succès !", "success");
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error("CREATE FIELD ERROR:", err);
        this.confirmationService.error(err.error?.message || "Erreur lors de la création du terrain.");
        this.isSubmitting = false;
      }
    });
  }
}
