import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/DeviceEntity';
import {
  Device,
  DeviceRepository
} from '../../../domain/ports/DeviceRepository';

// clase para representar el repositorio de dispositivos usando typeorm
export class TypeOrmDeviceRepository implements DeviceRepository {
    constructor( //construtor que recibe como parametro el repositorio de dispositivo usando typeormrface 
        private repository: Repository<DeviceEntity>) {}
    async findActiveByUser(userId: string): Promise<Device[]> {
        const entities = await this.repository.find({
            where: { userId, active: true }
        });
//  obtenemos todos los dispositivos activos del usuario
        return entities.map((device) => ({
            id: device.id,
            userId: device.userId,
            expoPushToken: device.expoPushToken,
            platform: (device as unknown as { platform: 'android' | 'ios' }).platform,
            active: device.active
        }))};
    // guardamos o actualizamos el dispositivo     
    async save(device: Omit<Device, 'id'>): Promise<Device> {
        const existing = await this.repository.findOne({ where: { expoPushToken: device.expoPushToken } });
        const entity: DeviceEntity = this.repository.create({
      ...existing,
      ...device,
      active: true,
      lastSeenAt: new Date()
    });
//actualizamos el dispositivo 
        const saved: DeviceEntity = await this.repository.save(entity);
        return {
            id: saved.id,
             userId: saved.userId,
      expoPushToken: saved.expoPushToken,
    platform: device.platform,
      active: saved.active
        };
    }
  // desactivamos el dispositivo   
    async deactivate(token: string): Promise<void> {
        await this.repository.update({ expoPushToken: token },
            { active: false });
    }}