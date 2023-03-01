import { Injectable } from "@angular/core";
import { AsyncValidator, AbstractControl, ValidationErrors } from "@angular/forms";

@Injectable({ providedIn: "root" })
export class DuplicateEmailValidator implements AsyncValidator {
    private readonly existingEmails: string[] = [ "Race.Underwood@agvance.net" ];

    public constructor() {}

    // When creating async Validators you must create an injectable class that implements AsyncValidator
    public validate(control: AbstractControl): Promise<ValidationErrors | null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(control.value)
                this.existingEmails.includes(control.value) ? resolve({ invalidEmail: true }) : resolve(null);
            }, 2000);
        })
    }
}