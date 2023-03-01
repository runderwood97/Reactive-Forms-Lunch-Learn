import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators, FormControl } from "@angular/forms";
import { CharacterClass, Class, User, UserEmail, UserPhone } from "../shared/models/user-models";
import { DuplicateEmailValidator } from "../shared/validators/async-validator.service";

@Component({
    selector: "app-form-with-builder",
    templateUrl: "./form-builder.component.html",
    styleUrls: [ "../shared/styles/form.component.scss" ]
})
export class FormWithBuilderComponent implements OnInit {
    public formGroup!: FormGroup
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
    ];

    public constructor(
        private readonly formBuilder: FormBuilder,
        private readonly duplicateEmailValidator: DuplicateEmailValidator
    ) {}

    public ngOnInit(): void {
        this.formGroup = this.createForm();

        console.log("Form With Builder", this.formGroup);

        // This is a good example of how sectioning your Form out into seperate FormGroups could case issues
        // In the other example I was able to directly subscribe to the the observable form the control
        // Here however becasue i have grouped the data into like FormGroups I must break it down piece by piece
        // This is because of ReactiveForms terrible typeing system
        const classGroup = this.formGroup.get("characterInfo") as FormGroup;
        classGroup.get("class")?.valueChanges.subscribe((value: number) => {
            const message = value === 9 ? "Would You Like To Reconsider That" : "You Have Chosen Wisely";
            alert(message);
        });
    }

    public get phoneControls(): AbstractControl[] {
        // Instead of using this.formGroup.get('phoneNumbers') this is an example
        // of the alternative way to get access to a control
        // I personally have found to run into typeing errors more often when using this
        // approach as such I prefer to use .get()
        const phones = this.formGroup.controls["phoneNumbers"] as FormArray;
        return phones.controls;
    }

    public get emailControls(): AbstractControl[] {
        const emails = this.formGroup.controls["emails"] as FormArray;
        return emails.controls;
    }

    public get errorsFound(): boolean {
        return this.errors.length > 0;
    }

    public addPhoneNumber(): void {
        const phoneControls = this.formGroup.controls["phoneNumbers"] as FormArray;
        const newControl = this.formBuilder.group({
            phoneNumber: ["", [ this.validPhoneNumber() ]],
            isPrimary: [false]
        });

        phoneControls.push(newControl);
    }

    public removePhoneNumber(index: number): void {
        const phoneControls = this.formGroup.controls["phoneNumbers"] as FormArray;
        const controlGroup = phoneControls.controls[index] as FormGroup;

        if(controlGroup.get("phoneNumber")?.hasValidator(Validators.required)) {
            return;
        }

        phoneControls.removeAt(index);
    }

    public addEmail(): void {
        const emailControls = this.formGroup.controls["emails"] as FormArray;
        const newControl = this.formBuilder.group({
            email: this.formBuilder.control("", {
                updateOn: "blur",
                validators: [ Validators.minLength(3), Validators.email ],
                asyncValidators: [ this.duplicateEmailValidator.validate.bind(this.duplicateEmailValidator) ]
            }),
            isPrimary: [false]
        });

        emailControls.push(newControl);
    }

    public removeEmail(index: number): void {
        const emailControls = this.formGroup.controls["emails"] as FormArray;
        const controlGroup = emailControls.controls[index] as FormGroup;

        if(controlGroup.get("email")?.hasValidator(Validators.required)) {
            return;
        }

        emailControls.removeAt(index);
    }

    public onSubmit(): void {
        if (this.formGroup.valid) {
            // Note: It is mostly when you are trying to get to the form controls themselves that you
            // will deal with type issues. They value's of the controls can be easily retrieved as any json value
            // can be
            const userEmails: UserEmail[] = this.formGroup.value.emails;
            const userPhones: UserPhone[] = this.formGroup.value.phones;
            const characterClass: CharacterClass = this.formGroup.value.characterInfo;

            const user: User = {
                firstName: this.formGroup.value.personal.firstName,
                lastName: this.formGroup.value.personal.lastName,
                address: this.formGroup.value.personal.address,
                phoneNumbers: userPhones,
                emails: userEmails,
                class: characterClass
            }

            this.errors = [];

            console.log("SUCCESS");
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
        // NOTE: The way the pattern validator works is that the regular expression must find a match
        // If no match is found the input is invalid
        const noSpecialCharacters = /^((?!&|@|!|#|\$|%|\^|\*|\(|\)|_).)*$/;

        // NOTE: When using the FormBuilder there are two ways to create FormControls
        // you can either just provide a list of data or you can use FormBuilder.control()
        // It should be noted that if you do not use FormBuilder.control() intellicence will
        // not catch anything.
        const emailGroup = this.formBuilder.group({
            email: this.formBuilder.control("", {
                updateOn: "blur",
                validators: [ Validators.required, Validators.email, Validators.minLength(3) ],
                asyncValidators: [ this.duplicateEmailValidator.validate.bind(this.duplicateEmailValidator) ]
            }),
            isPrimary: this.formBuilder.control(false)
        });

        const phoneGroup = this.formBuilder.group({
            phoneNumber: ["", [ Validators.required, this.validPhoneNumber() ]], // Example of just passing in a list
            isPrimary: [false]
        });

        const form = this.formBuilder.group({
            personal: this.formBuilder.group({
                firstName: ["", [ Validators.required, Validators.pattern(noSpecialCharacters), Validators.maxLength(25) ]],
                lastName: ["", [ Validators.required, Validators.pattern(noSpecialCharacters), Validators.maxLength(25) ]],
                address: ["", [ Validators.required, Validators.pattern(noSpecialCharacters), Validators.maxLength(75) ]]
            }),
            emails: this.formBuilder.array([emailGroup]),
            phoneNumbers: this.formBuilder.array([phoneGroup]),
            characterInfo: this.formBuilder.group({
                class: [null, [ Validators.required ]],
                level: [null, [ Validators.required, Validators.min(1), Validators.max(20) ]]
            })
        });

        return form;
    }
}