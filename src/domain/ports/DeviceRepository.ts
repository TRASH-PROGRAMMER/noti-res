export interface Device {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: 'android' | 'ios';
  active: boolean;
}

export interface DeviceRepository {
  save(device: Omit<Device, 'id'>): Promise<Device>;

  findActiveByUser(
    userId: string
  ): Promise<Device[]>;

  deactivate(token: string): Promise<void>;
}