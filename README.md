# ⚡ Centro de Control Domótico — FUSALMO & Don Bosco

Dashboard web dark-futurista desarrollado en React y Tailwind CSS para el monitoreo y control en tiempo real de dispositivos domóticos (ESP32) integrados con la plataforma Cloud de **Sinric Pro** a través de una arquitectura segura basada en **Vercel Serverless Proxy**.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React + TypeScript (Vite)
* **Estilos:** Tailwind CSS (Diseño personalizado Dark/Futurista)
* **Iconografía:** Lucide React
* **Backend Cloud / IoT:** Sinric Pro REST API
* **Despliegue & Security Proxy:** Vercel (Reescritura de endpoints y manejo de variables de entorno)

---

## 🔐 Arquitectura de Seguridad y CORS

Para evitar exponer credenciales privadas y solucionar el bloqueo de CORS (*Cross-Origin Resource Sharing*) del navegador al consultar la API de Sinric Pro, el proyecto utiliza **Vercel Rewrites**:

1. El cliente consulta de manera segura a un endpoint relativo `/api/sinric/...`.
2. Vercel reenvía la petición internamente a `https://api.sinric.pro/v1/...`.
3. La clave de API se inyecta desde las **Variables de Entorno (`.env`)**, previniendo cualquier fuga en el código fuente o repositorios públicos.

---

## 🚀 Guía de Instalación Local

### Prerrequisitos
* Node.js (v18.0 o superior)
* npm, pnpm o yarn

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
   cd TU_REPOSITORIO