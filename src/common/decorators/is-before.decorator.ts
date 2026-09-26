import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isBefore', async: false })
export class IsBeforeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];

    if (value == null || relatedValue == null) return false;

    const date = new Date(value as string | number | Date);
    const relatedDate = new Date(relatedValue as string | number | Date);

    if (isNaN(date.getTime()) || isNaN(relatedDate.getTime())) return false;

    return date.getTime() < relatedDate.getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be before ${relatedPropertyName}`;
  }
}

export function IsBefore(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsBeforeConstraint,
    });
  };
}
