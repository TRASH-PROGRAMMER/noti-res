import { Request, Response } from 'express';
import { RegisterDevice } from '../../application/use-cases/RegisterDevice';
import { DeviceRepository } from '../../domain/ports/DeviceRepository';

export class DeviceController {

  constructor(
    private registerDevice: RegisterDevice,
    private devices: DeviceRepository
  ) {}

  register = async (req: Request, res: Response) => {

    const userId = req.user!.id;

    const device = await this.registerDevice.execute({
      userId,
      token: req.body.token,
      platform: req.body.platform
    });

    return res.status(201).json({
      message: 'Device registered',
      data: device
    });
  };

  deactivate = async (req: Request, res: Response) => {

    await this.devices.deactivate(req.params.token);

    return res.status(200).json({
      message: 'Device deactivated'
    });
  };
}