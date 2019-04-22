import { Component, OnInit, Input, forwardRef, AfterViewInit } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ReturnKeyType } from "tns-core-modules/ui/editable-text-base/editable-text-base";

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
  @Input() disabled: boolean;
  @Input() returnKeyType: ReturnKeyType;
  @Input('value') _value: string;

  public focused: boolean;

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor() {
    if (typeof this.returnKeyType === undefined) this.returnKeyType = 'next';
    if (typeof this.label === undefined) this.label = 'Label';
    if (typeof this.labelSmall === undefined) this.labelSmall = '';
    if (typeof this.placeholder === undefined) this.placeholder = '';

    this.focused    = false;
    this.onFocus    = this.onFocus.bind(this);
    this.loseFocus  = this.loseFocus.bind(this);
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
