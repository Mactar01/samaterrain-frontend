import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AdminService } from "../../core/services/admin.service";
import { AuthService } from "../../core/services/auth.service";
import { formatApiError } from "../../core/utils/error-formatter";
import { DarkModeToggleComponent } from "../../shared/components/dark-mode-toggle/dark-mode-toggle.component";

@Component({
  selector: "app-owner-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DarkModeToggleComponent],
  templateUrl: "./owner-register.html",
  styleUrls: ["./owner-register.scss"]
})
export class OwnerRegisterComponent implements OnInit {
  form!: FormGroup;
  token = "";
  invitation: any = null;
  loading = false;
  validating = true;
  tokenError = "";
  successMessage = "";
  errorMessage = "";

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token") || "";

    // Si on arrive sur une page d'invitation avec un jeton valide,
    // on s'assure qu'aucune session résiduelle (ex: admin en cours de test) ne vienne corrompre l'inscription
    if (this.token) {
      this.authService.clearSession();
    }

    this.form = this.fb.group(
      {
        name: ["", [Validators.required]],
        email: ["", [Validators.required, Validators.email]],
        phone: ["", [Validators.required]],
        business_name: ["", [Validators.required]],
        address: ["", [Validators.required]],
        siret: ["", [Validators.required]],
        password: ["", [Validators.required, Validators.minLength(8)]],
        password_confirmation: ["", [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );

    if (!this.token) {
      this.tokenError = "Lien d'invitation invalide ou manquant.";
      this.validating = false;
      return;
    }

    this.adminService.validateInviteToken(this.token).subscribe({
      next: (res: any) => {
        this.invitation = res;
        this.validating = false;
        if (res.email) {
          this.form.patchValue({ email: res.email });
        }
        if (res.business_name) {
          this.form.patchValue({ business_name: res.business_name });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.tokenError = "Ce lien d'invitation est invalide, a expiré ou a déjà été utilisé.";
        this.validating = false;
        this.cdr.detectChanges();
      }
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const pwd = group.get("password")?.value;
    const conf = group.get("password_confirmation")?.value;
    return pwd === conf ? null : { passwordMismatch: true };
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = "";

    const payload = {
      token: this.token,
      ...this.form.value
    };

    this.adminService.registerFromInvitation(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Connexion automatique immédiate avec le compte Loueur créé
        if (res && res.token && res.user) {
          this.authService.saveSession(res.token, res.user);
        }
        this.successMessage =
          "Félicitations ! Votre compte Loueur Partenaire a été activé. Redirection vers votre espace...";
        this.cdr.detectChanges();
        // Redirection vers l'espace Loueur Partenaire (JAMAIS vers /admin !)
        setTimeout(() => this.router.navigate(["/dashboard"]), 1200);
      },
      error: (err: any) => {
        this.errorMessage = formatApiError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}