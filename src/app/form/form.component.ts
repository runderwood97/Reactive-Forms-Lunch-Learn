import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators, ValidatorFn } from "@angular/forms";
import { User, Class } from "../shared/models/user-models";
import { DuplicateEmailValidator } from "../shared/validators/async-validator.service";

@Component({
    selector: "app-form",
    templateUrl: "./form.component.html",
    styleUrls: [ "../shared/styles/form.component.scss" ]
})
export class FormComponent implements OnInit {
    public formGroup!: FormGroup;
    public errors: string[] = [];
    public classes: Class[] = [
        {
            id: 1,
            name: "Artificer"
        },
        {
            id: 2,
            name: "Barbarian"
        },
        {
            id: 3,
            name: "Bard"
        },
        {
            id: 4,
            name: "Cleric"
        },
        {
            id: 5,
            name: "Druid"
        },
        {
            id: 6,
            name: "Fighter"
        },
        {
            id: 7,
            name: "Monk"
        },
        {
            id: 8,
            name: "Paladin"
        },
        {
            id: 9,
            name: "Ranger"
        },
        {
            id: 10,
            name: "Rogue"
        },
        {
            id: 11,
            name: "Sorcerer"
        },
        {
            id: 12,
            name: "Warlock"
        },
        {
            id: 13,
            name: "Wizard"
        }
    ]

    public constructor(
        private readonly duplicateEmailValidator: DuplicateEmailValidator
    ) {}

    public ngOnInit(): void {
        this.formGroup = this.createForm();

        console.log("All One Group", this.formGroup)

        // NOTE: No mater which AbstractControl you are dealing with FormControl, FormArray, Or a FormGroup
        // Each have an observable you can subscribe to for when a value of a child within the control changes
        this.formGroup.get("class")?.valueChanges.subscribe((value: number) => {
            const message = value === 9 ? "Would You Like To Reconsider That" : "You Have Chosen Wisely";
            alert(message);
        });
    }

    public get emailControls(): AbstractControl[] {
        // One of the negatives to using Reactive Forms is that is has terrible typeing
        // If while using them you encounter a type error be sure to cast the object as the type
        // Here in this example this.formGroup.get('emails') is a FormArray but do to the reactive 
        // forms terrible typing it will not recognize it as such unless you casts it as such
        // you will see this often thoughout this example
        const emails = this.formGroup.get("emails") as FormArray;
        return emails.controls;
    }

    public get phoneControls(): AbstractControl[] {
        const phoneNumbers = this.formGroup.get("phoneNumbers") as FormArray;
        return phoneNumbers.controls;
    }

    public get errorsFound(): boolean {
        return this.errors.length > 0;
    }

    public addPhoneNumber() {
        const currentPhoneControls = this.formGroup.get("phoneNumbers") as FormArray;
        const newPhoneNumber = new FormGroup({
            phoneNumber: new FormControl("", [ this.validPhoneNumber() ]),
            isPrimary: new FormControl(false)
        });

        currentPhoneControls.push(newPhoneNumber);
    }

    public removePhoneNumber(index: number) {
        const currentPhoneControls = this.formGroup.get("phoneNumbers") as FormArray;
        const controlGroup = currentPhoneControls.controls[index] as FormGroup;

        if (controlGroup.get("phoneNumber")?.removeValidators(Validators.required)) {
            return;
        }

        currentPhoneControls.removeAt(index);
    }

    public addEmail() {
        const currentEmailControls = this.formGroup.get("emails") as FormArray;
        const newEmail = new FormGroup({
            email: new FormControl("", [ Validators.email, Validators.minLength(3) ]),
            isPrimary: new FormControl(false)
        });

        currentEmailControls.push(newEmail);
    }

    public removeEmail(index: number) {
        // NOTE: When accessing the controls you can not do this.formGroup.controls.emails you must do ['controlName']
        // Or you could use the get() method to retrieve a control by its key name this.formGroup.get('emails').
        // NOTE: even when using the get() method you may still have to cast it
        const currentEmailControls = this.formGroup.get("emails") as FormArray;
        const controlGroup = currentEmailControls.controls[index] as FormGroup;

        if (controlGroup.get("email")?.hasValidator(Validators.required)) {
            return;
        }

        currentEmailControls.removeAt(index);
    }

    public onSubmit() {
        if (this.formGroup.valid) {
            const user: User = this.formGroup.value as User;
            this.errors = [];

            console.log("SUCCESS")
            console.log(user);
        }
        else {
            this.errors = this.getErrors(this.formGroup);
        }
    }

    private getErrorMessage(formKey: string, errorType: string): string {
        return `${formKey} ` + ({
            "required": "is required",
            "min" : "is to small a value",
            "max" : "is to large a value",
            "email" : "is not a valid email",
            "pattern" : "has invalid data in it",
            "invalidEmail" : "already exists",
            "phoneNumber" : "is misformatted"
        })[errorType];
    }

    private getErrors(abstractControl: FormArray | FormGroup): string[] {
        return Object.keys(abstractControl.controls).flatMap(control => {
            const currentAbstractControl = abstractControl.get(control);

            if (currentAbstractControl instanceof FormArray || currentAbstractControl instanceof FormGroup) {
                return this.getErrors(currentAbstractControl);
            }

            const formControl = currentAbstractControl as FormControl;
            const controlErrors: ValidationErrors | null = formControl.errors;

            return controlErrors ? Object.keys(controlErrors).map(error => this.getErrorMessage(control, error)) : [];
        });
    }

    private validPhoneNumber(): ValidatorFn {
        const reg = new RegExp(/^(\+\d{1,3}\s)?\(?\d{3}\)?[\s-]\d{3}[\s-]\d{4}$/);

        return (control: AbstractControl): ValidationErrors | null => { 
            return !reg.test(control.value) ? { phoneNumber: { value: "invalid phone number" } } : null;
        }
    }

    private createForm(): FormGroup {
        // NOTE: By default an AbstractControl will check its validation on 'change'.
        // The alternatives are 'blur' & 'submit'.
        // 'change' will run the validation as the value of the AbstractControl changes
        // 'blur' will run the validation when the AbstractControl looses focus
        // 'submit' will run the validation when the form is submitted
        // Most likely if you have an async validator you are calling an API with this in mind 
        // it is most likely you will want to set 'updateOn' to 'submit' to prevent unnessesary API calls
        // NOTE: 'updateOn' 'submit' is terrible, absolutely terrible. Reactive Forms does not await the async validation
        // This means upon submission the async validators are still processing as a result the form will be invalid.
        // There appears to be several requests the the Angular team to allow reactive forms to await the async 
        // validators but as of now those requests have not been fulfilled. Instead I recommend 'blur' in combination with 
        // the pending status.
        const emailControls = new FormGroup({
            email: new FormControl("", {
                updateOn: "blur",
                validators: [ Validators.required, Validators.email, Validators.minLength(3) ],
                asyncValidators: [ this.duplicateEmailValidator.validate.bind(this.duplicateEmailValidator) ]
            }),
            isPrimary: new FormControl(false)
        });
        const phoneControls = new FormGroup({
            phoneNumber: new FormControl("", [ Validators.required, this.validPhoneNumber() ]),
            isPrimary: new FormControl(false)
        });

        // NOTE: The way the pattern validator works is that the regular expression must find a match
        // If no match is found the input is invalid
        const noSpecialCharacters = /^((?!&|@|!|#|\$|%|\^|\*|\(|\)|_).)*$/;

        const form = new FormGroup({
            firstName: new FormControl("", [ Validators.required, Validators.pattern(noSpecialCharacters), Validators.maxLength(25) ]),
            lastName: new FormControl("", [ Validators.required, Validators.pattern(noSpecialCharacters), Validators.maxLength(25) ]),
            address: new FormControl("", [ Validators.required, Validators.pattern(noSpecialCharacters), Validators.maxLength(75) ]),
            emails: new FormArray([emailControls]),
            phoneNumbers: new FormArray([phoneControls]),
            class: new FormControl(null, [ Validators.required ]),
            level: new FormControl(null, [ Validators.required, Validators.min(1), Validators.max(20) ])
        });

        return form;
    }
}