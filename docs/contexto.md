# Sistema completo de notificaciones locales y Push con Expo + Express + TypeScript

## Descripción General

Módulo de notificaciones con arquitectura hexagonal (Ports & Adapters), separando la lógica de negocio de Expo, Firebase y Express.

La solución tendrá dos responsabilidades principales:
•Aplicación móvil: gestionar permisos, tokens, notificaciones locales, recepción de Push, interacciones y navegación.

•Backend Express: registrar dispositivos, generar notificaciones, enviar Push, gestionar suscripciones y mantener un historial de notificaciones.

Utilizaremos Expo Push Service para enviar notificaciones remotas inicialmente. Esto permite trabajar con Expo sin implementar directamente FCM y APNs en el backend.

## Stack tecnológico

Frontend
React Native + Expo + TypeScript

Backend
Node.js + Express + TypeScript

Push
Expo Push Notifications

Persistencia
PostgreSQL + TypeORM

Arquitectura
Hexagonal + Clean Architecture

## Arquitectura general

Primero definimos las responsabilidades y el flujo de comunicación.

El diagrama rquitectura se encuentra en  C:\Users\RUDY PICO\Desktop\noti-rest\ARQUITECTURA DE NOTIFICACIONES.jpg

Principio fundamental: el dominio no debe conocer Expo, Express, PostgreSQL ni Firebase. Solamente debe conocer contratos como NotificationSender o DeviceRepository.

## Estructura del proyecto

Mantener frontend y backend separados, pero utilizar contratos compartidos conceptualmente para evitar inconsistencias en los mensajes.

```
notification-system/
│
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx
│   │   └── notifications/
│   │       └── index.tsx
│   │
│   └── src/
│       ├── core/
│       │   └── config/
│       │       └── environment.ts
│       │
│       ├── domain/
│       │   ├── entities/
│       │   │   └── Notification.ts
│       │   └── ports/
│       │       ├── NotificationGateway.ts
│       │       └── DeviceGateway.ts
│       │
│       ├── application/
│       │   ├── RegisterPushDevice.ts
│       │   ├── ScheduleLocalNotification.ts
│       │   └── HandleNotificationResponse.ts
│       │
│       ├── infrastructure/
│       │   ├── notifications/
│       │   │   ├── ExpoNotificationAdapter.ts
│       │   │   └── NotificationListeners.ts
│       │   └── http/
│       │       └── NotificationApi.ts
│       │
│       ├── presentation/
│       │   ├── providers/
│       │   │   └── NotificationProvider.tsx
│       │   └── hooks/
│       │       └── useNotifications.ts
│       │
│       └── navigation/
│           └── NotificationNavigation.ts
│
└── backend/
    └── src/
        ├── domain/
        │   ├── entities/
        │   │   └── Notification.ts
        │   └── ports/
        │       ├── NotificationRepository.ts
        │       ├── DeviceRepository.ts
        │       └── NotificationSender.ts
        │
        ├── application/
        │   ├── use-cases/
        │   │   ├── RegisterDevice.ts
        │   │   ├── SendNotification.ts
        │   │   ├── MarkAsRead.ts
        │   │   └── DeactivateDevice.ts
        │   └── dto/
        │
        ├── infrastructure/
        │   ├── database/
        │   │   ├── entities/
        │   │   └── repositories/
        │   └── push/
        │       └── ExpoPushAdapter.ts
        │
        ├── presentation/
        │   ├── controllers/
        │   ├── routes/
        │   └── middlewares/
        │
        ├── config/
        └── main.ts
```

La regla de dependencia será:

```
Presentation → Application → Domain
Infrastructure → Domain
```

El dominio define los contratos. La infraestructura los implementa. Los casos de uso coordinan las operaciones.

## base de datos
Vamos a necesitar dos tablas principales:
1.devices: registra los dispositivos que pertenecen a cada usuario.
2.notifications: mantiene el historial de notificaciones.

### Modelo relacional

```

erDiagram
    USERS {
        UUID id PK
        VARCHAR email
        VARCHAR name
    }
    DEVICES {
        UUID id PK
        UUID user_id FK
        VARCHAR expo_push_token
        VARCHAR platform
        BOOLEAN active
    }
    NOTIFICATIONS {
        UUID id PK
        UUID user_id FK
        VARCHAR title
        TEXT body
        JSONB data
        TIMESTAMP read_at
    }
    USERS ||--o{ DEVICES : "tiene"
    USERS ||--o{ NOTIFICATIONS : "recibe"

```

### Descripción de las relaciones

Relación	Cardinalidad	Descripción
USERS → DEVICES	1:N	Un usuario puede registrar varios dispositivos.
USERS → NOTIFICATIONS	1:N	Un usuario puede recibir múltiples notificaciones.

### Consideraciones de diseño

- users: almacena la información básica de los usuarios.
- devices: permite registrar varios dispositivos por usuario para enviar notificaciones push mediante Expo.
- notifications: almacena las notificaciones asociadas a cada usuario.
- expo_push_token: identifica el destino de las notificaciones push.
- platform: permite identificar si el dispositivo utiliza Android o iOS.
- active: permite habilitar o deshabilitar un dispositivo.
- data: almacena información adicional en formato JSONB.
- read_at: almacena la fecha y hora en que se leyó la notificación. Si es NULL, todavía no se ha leído.


## mobile

!!!
Las notificaciones Push remotas necesitan un development build. Expo Go no es el entorno adecuado para probar esta funcionali.dad

### Android

Necesitas configurar Firebase Cloud Messaging V1:

1. Entra en Firebase Console.
2. Crea un proyecto.
3. Registra tu aplicación Android con el mismo package del app.json.
4. Configura Firebase Cloud Messaging.
5. Genera una cuenta de servicio para FCM V1.
6. Entra en tu proyecto de Expo y configura las credenciales FCM V1 mediante EAS.

Los canales deben configurarse antes de solicitar el token Push en Android.

### Gestionar eventos del ciclo de vida

Este es uno de los puntos más importantes.

Necesitas escuchar:

- Notificación recibida.
- Usuario interactúa con una notificación.
- Usuario abre una notificación con la aplicación cerrada.
- Cambio de permisos.
- Limpieza de listeners.

### Gestionar notificaciones en segundo plano

Hay una diferencia importante entre recibir una notificación visible y ejecutar código JavaScript en segundo plano.

Para las notificaciones normales:

- Android puede mostrar el mensaje mientras la aplicación está cerrada.
- El sistema operativo se encarga de mostrarlo.
- Cuando el usuario toca el aviso, la aplicación se abre.

## CONFIGURACIÓN Y PRUEBAS

```
npm install -g eas-cli

eas login

eas build:configure
```

Crea un archivo eas.json:

```


{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}

```

Construcción Android:

```

eas build --profile development --platform android

```

Después de instalar el development build:

```

npx expo start --dev-client

```

## Probar el backend

Primero registra el token que obtuviste desde la aplicación.

```

POST /api/devices/register
Authorization: Bearer TU_JWT
Content-Type: application/json

```

```
{
  "token": "ExponentPushToken[TU_TOKEN]",
  "platform": "android"
}

```

envía una notificación:

```

POST /api/notifications/send
Authorization: Bearer TU_JWT_ADMIN
Content-Type: application/json

```

El dispositivo recibirá el mensaje y el listener procesará el evento correspondiente.

## El ciclo completo y sus estados

Debes separar los estados de la aplicación de los estados de la notificación.


Estados de la aplicación:

```

FOREGROUND
BACKGROUND
TERMINATED

```

Estados de una notificación en el backend:

```
PENDING
   |
   v
SENDING
   |
   v
ACCEPTED
   |
   v
PROVIDER_ACCEPTED
   |
   v
READ

```


PROVIDER_ACCEPTED indica que el servicio de Apple o Google aceptó el mensaje según el receipt de Expo. No demuestra que la persona lo haya visto.

Para implementar correctamente el ciclo completo, añade un proceso de consulta de receipts:

1. Almacenar el ticket devuelto por Expo.
2. Esperar aproximadamente 15 minutos.
3. Consultar los receipts en lotes de hasta 1000 identificadores.
4. Actualizar el estado.
5. Si aparece DeviceNotRegistered, desactivar ese token.
6. Reintentar únicamente errores transitorios con backoff exponencial.
Expo recomienda esta comprobación porque aceptar una notificación no significa que haya llegado al dispositivo


## Mejoras necesarias antes de producción
Te recomiendo priorizar estas cinco mejoras:

1. Idempotencia: utiliza un identificador único por evento para evitar notificaciones duplicadas.
2. Outbox Pattern: registra el evento de negocio y su intención de notificación dentro de una transacción. Un worker independiente realiza el envío.
3. Procesamiento asíncrono: incorpora RabbitMQ o Redis cuando aumente el volumen.
4. Receipts: implementa un worker para consultar los resultados de Expo.
5. Seguridad: valida usuarios, permisos, tokens, payloads y límites de envío.











