import { Component, OnInit, Input, forwardRef, AfterViewInit } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'InputField, [InputField]',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputFieldComponent),
    multi: true
  }]
})
export class InputFieldComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() labelSmall: string;
  @Input() placeholder: string;
  @Input() hasError: boolean;
  @Input('value') _value: string;

  public focused: boolean;

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor() {
    this.focused = false;
    this.onFocus = this.onFocus.bind(this);
    this.loseFocus = this.loseFocus.bind(this);
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  public writeValue(val: any) {
    if (val !== undefined) this._value = val;
    else this._value = '';
  }

  public registerOnChange(fn) {
    this.onChange = fn;
  }

  public registerOnTouched(fn) {
    this.onTouched = fn;
  }

  public onFocus(): void {
    this.focused = true;
  }

  public loseFocus(): void {
    this.focused = false;
  }
}
