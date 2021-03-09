import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms'
import { debounceTime } from 'rxjs/operators'
import { Customer } from './customer';

// Adding it here since its used in this component only
// We are expecting either a key:boolean pair or null
function ratingRangeMain(c: AbstractControl): { [key: string]: boolean } | null {
  // If Validation does not match we return a string boolen pair
  if (c.value !== null && (isNaN(c.value) || c.value < 1 || c.value > 5)) {
    // String boolean pair
    // String is the validation rule, in this case its called range
    // This range will be in the html in the form of '<span *ngIf="customerForm.get('rating').errors?.range">
    return { 'range': true };
  }
  // If the validation matches we return null
  return null;
}

// Factory method to pass in the max or min since the validor function above can only accept on parameter. 
// The return type for this method is set to ValidatorFn
function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {

    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true };
    }

    return null;
  };
}

// Validator function for email
// The parameter here will be the passed in formgroup
function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {

  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  // If the control has not been touched, skip validation.
  if (emailControl.pristine || confirmControl.pristine) {
    return null;
  }

  if (emailControl.value == confirmControl.value) {
    return null;
  }

  // Return true which will be used in the html to display error message if emails dont match.
  // It adds the validation rule name to the form group not the form control.
  return { 'match': true };

}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {

  customerForm: FormGroup;
  customer = new Customer();
  emailMessage: string;

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please eanter a valid email address.'
  }



  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {

    // Using formbuilder to create a form group
    this.customerForm = this.fb.group({
      //firstName: "adib", // Key/value pair: Formcontrol name and value
      firstName: ['', [Validators.required, Validators.minLength(3)]], // Setting validators
      // lastName: { value: "khan", disabled: true }, // another way to initialize a formControl
      lastName: [{ value: "", disabled: false }, [Validators.required, Validators.maxLength(10)]],
      phoneNumber: '',
      rating: [null, ratingRange(1, 10)], // Custom validator, check ratingRange above.
      notification: 'email',
      sendCatalog: true,
      addresses: this.fb.array([this.buildAddress()]),
      // This is for cross field validation. This is called nested form group.
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required, Validators.email]],
      },
        // Form group requires us to pass in a validator object
        { validators: emailMatcher })
    })

    // Manually creating the form group
    // this.customerForm = new FormGroup({
    //   firstName: new FormControl(),
    //   lastName: new FormControl(),
    //   email: new FormControl(),
    //   sendCatalog: new FormControl(true)
    // });

    // This needs to be after the root formgroup other wise this reference is null.
    this.customerForm.get('notification').valueChanges.subscribe(
      value => {
        console.log(value);
        this.setNotification(value);
      }
    );

    // get the email control from the emailGroup.
    var emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      // Adds a delay for the user to enter the value before validation kicks in
      debounceTime(1000)
    ).subscribe(
      value => {
        // Pass in the email control.
        this.setMessage(emailControl)
      }
    )

  }

  save(): void {
    console.log(this.customerForm);
    //console.log('Saved: ' + JSON.stringify(this.customerForm));
  }

  populateTestData(): void {
    // SetValue() requires us to populate all the value for the form
    // PatchValue() set values in for a subset of the values. 
    this.customerForm.patchValue({
      firstName: 'Adib',
      email: "adib.khan@hello.com",
      sendCatalog: false
    });

  }

  // this method takes in a form group or form control so we pass in AbstractControl
  setMessage(c: AbstractControl): void {
    // This removes all the left over message from us touching the control previously
    this.emailMessage = '';
    // These validation are removed from the html
    if ((c.touched || c.dirty) && c.errors) {
      // This is a javascript object.key to return the array of the error collection of the form control.
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }


  setNotification(value: string) {
    // Get the control name
    let phoneControl = this.customerForm.get('phoneNumber');
    if (value === 'text') {
      // Set the validator for the control
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    // Once we are done we need to reevaluate for control validation state. This trigger revaluation
    phoneControl.updateValueAndValidity();
  }


  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
    })
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress())
  }
}
