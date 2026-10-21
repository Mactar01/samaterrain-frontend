import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FieldService } from '../../../core/services/field.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { formatApiError } from '../../../core/utils/error-formatter';

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
    reference: '',
    type: 'artificial_grass',
    surface_type: 'artificial_grass',
    location: '',
    city: '',
    address: '',
    description: '',
    price_per_hour: 0,
    capacity: 10,
    currency: 'FCFA',
    is_active: true
  };

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isSubmitting = false;
  errorMessage = '';

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => this.imagePreviews.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
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
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    if (this.field.surface_type) {
      formData.set('type', this.field.surface_type);
      formData.set('surface_type', this.field.surface_type);
    }
    
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('images[]', file);
      });
      formData.append('image', this.selectedFiles[0]);
    }
    
    this.fieldService.createField(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.confirmationService.toast("Terrain ajouté avec succès !", "success");
        this.router.navigate(['/dashboard/fields']);
      },
      error: (err) => {
        console.error("CREATE FIELD ERROR:", err);
        this.confirmationService.error(formatApiError(err));
        this.isSubmitting = false;
      }
    });
  }
}
