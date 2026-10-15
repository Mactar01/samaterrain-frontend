/**
 * Formate et traduit les erreurs d'API (Laravel Validation, etc.) en français naturel.
 */
export function formatApiError(err: any): string {
  if (!err) return 'Une erreur inattendue est survenue.';

  // 1. Erreurs de validation de champs (errors: { password: [...], email: [...] })
  if (err.error?.errors && typeof err.error.errors === 'object') {
    const errorMessages: string[] = [];
    const translationMap: Record<string, string> = {
      'validation.password.letters': 'Le mot de passe doit contenir au moins une lettre.',
      'validation.password.mixed': 'Le mot de passe doit combiner des majuscules et des minuscules.',
      'validation.password.numbers': 'Le mot de passe doit contenir au moins un chiffre.',
      'validation.password.symbols': 'Le mot de passe doit contenir au moins un caractère spécial (@, #, !, etc.).',
      'validation.password.uncompromised': 'Ce mot de passe est trop vulnérable, veuillez en choisir un plus sûr.',
      'validation.min.string': 'Le texte est trop court (au moins 8 caractères requis).',
      'validation.required': 'Ce champ est obligatoire.',
      'validation.email': 'Veuillez saisir une adresse email valide.',
      'validation.unique': 'Cette valeur est déjà utilisée par un autre compte.',
      'validation.confirmed': 'La confirmation ne correspond pas au mot de passe.'
    };

    Object.keys(err.error.errors).forEach((field) => {
      const messages = err.error.errors[field];
      if (Array.isArray(messages)) {
        messages.forEach((msg: string) => {
          const translated = translationMap[msg] || msg;
          errorMessages.push(translated);
        });
      } else if (typeof messages === 'string') {
        errorMessages.push(translationMap[messages] || messages);
      }
    });

    if (errorMessages.length > 0) {
      return errorMessages.join(' ');
    }
  }

  // 2. Message global
  if (err.error?.message) {
    const msg = err.error.message;
    if (msg === 'Données invalides.' || msg === 'The given data was invalid.') {
      return 'Veuillez vérifier les informations renseignées.';
    }
    if (msg.includes('Unauthenticated') || msg.includes('Non authentifié')) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }
    return msg;
  }

  // 3. Fallback standard
  return err.status === 401
    ? 'Identifiants incorrects ou compte inactif.'
    : 'Une erreur est survenue lors de la communication avec le serveur.';
}
