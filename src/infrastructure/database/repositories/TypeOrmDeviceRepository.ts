import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/DeviceEntity';
import {
  Device,
  DeviceRepository
} from '../../../domain/ports/DeviceRepository';


export class TypeOrmDeviceRepository implements DeviceRepository {
    constructor(
        private repository: Repository<DeviceEntity>) {}

    async save(device: Omit<Device, 'id'>): Promise<Device> {
        const existing = awit this.repository.findOne({ where: { expoPushToken: device.expoPushToken } });
        const entity = this.repository.create({
      ...existing,
      ...device,
      active: true,
      lastSeenAt: new Date()
    });

        const saved = await this.repository.save(entity);
        return {
            id: saved.id,
             userId: saved.userId,
      expoPushToken: saved.expoPushToken,
      platform: saved.platform as 'android' | 'ios',
      active: saved.active
        };
    }
    async deactivate(token: string): Promise<void> {
        await this.repository.update({ expoPushToken: token },
            { active: false });
    }}