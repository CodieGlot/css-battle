import type { ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
import { registerDecorator, ValidatorConstraint } from 'class-validator';

@ValidatorConstraint({ async: true })
class IsBeforeConstraint implements ValidatorConstraintInterface {
    validate(propertyValue: string, args: ValidationArguments) {
        return propertyValue < args.object[args.constraints[0]];
    }

    defaultMessage(args: ValidationArguments) {
        return `"${args.property}" must be before "${args.constraints[0]}"`;
    }
}

export function IsBefore(property: string, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object, propertyName: string) {
        registerDecorator({
            name: 'isBefore',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsBeforeConstraint
        });
    };
}
