import { Component, Input, forwardRef, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ReturnKeyType } from 'tns-core-modules/ui/editable-text-base/editable-text-base';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar } from 'nativescript-snackbar';

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
  @Input() allowCopy: boolean;
  @Input() returnKeyType: ReturnKeyType;
  @Input('value') _value: string;

  @Output() onCopy = new EventEmitter();

  public focused: boolean;

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(
    private _snack: SnackBar
  ) {
    if (typeof this.returnKeyType === undefined) this.returnKeyType = 'next';
    if (typeof this.label === undefined) this.label = 'Label';
    if (typeof this.labelSmall === undefined) this.labelSmall = '';
    if (typeof this.placeholder === undefined) this.placeholder = '';
    if (typeof this.allowCopy === undefined) this.allowCopy = false;

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

  public onTapCopy() {
    Clipboard.setText(this._value)
    .then(async () => {
      try {
        this.onCopy.emit();
        await this._snack.simple(`Copied ${this._value} to clipboard!`, '#ffffff', '#333333', 3, false);
      } catch (err) {
        console.log(`[InputField] Failed to copy ${this._value} to clipboard`);
        console.log(err.message ? err.message : err);
      }
    });
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
