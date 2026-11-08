export interface Device { // interface para representar una entidad de dispositivo
  id: string;
  userId: string;
  expoPushToken: string;
  platform: 'android' | 'ios';
  active: boolean;
}

export interface DeviceRepository { // / interface para representar el repositorio de dispositivos
  save(device: Omit<Device, 'id'>): Promise<Device>;

  findActiveByUser(
    userId: string
  ): Promise<Device[]>;

  deactivate(token: string): Promise<void>;
}