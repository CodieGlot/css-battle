import { StringField } from '../../../../decorators';

export class UploadAvatarDto {
    @StringField()
    avatarUrl: string;
}
