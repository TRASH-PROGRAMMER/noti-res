import { DeviceRepository } from '../../domain/ports/DeviceRepository';

interface RegisterDeviceDTO {
  userId: string;
  token: string;
  platform: 'android' | 'ios';
}

export class RegisterDevice {
  constructor(
    private deviceRepository: DeviceRepository) {}
    async execute(dto: RegisterDeviceDTO) {
        if(!dto.token.startsWith('ExponentPushToken')&& 
           !dto.token.startsWith('ExpoPushToken')){ 
         throw new Error('Invalid Expo push token');}
        
        return this.deviceRepository.save({
             userId: dto.userId,
      expoPushToken: dto.token,
      platform: dto.platform,
      active: true
        });
    }}