import type { ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
import { registerDecorator, ValidatorConstraint } from 'class-validator';

@ValidatorConstraint({ async: true })
class IsAfterCurrentDateConstraint implements ValidatorConstraintInterface {
    validate(propertyValue: string, _args: ValidationArguments) {
        return new Date(propertyValue) > new Date();
    }

    defaultMessage(args: ValidationArguments) {
        return `"${args.property}" must be after "currentDate"`;
    }
}

export function IsAfterCurrentDate(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object, propertyName: string) {
        registerDecorator({
            name: 'isAfterCurrentDate',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsAfterCurrentDateConstraint
        });
    };
}
