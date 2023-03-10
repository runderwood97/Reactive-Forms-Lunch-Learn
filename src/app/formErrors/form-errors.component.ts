import { Component, Input } from "@angular/core";

@Component({
    selector: "app-form-errors",
    templateUrl: "./form-errors.component.html",
    styleUrls: [ "./form-errors.component.scss" ]
})
export class FormErrorComponent {
    @Input() errors!: string[];

    public constructor() {}
}