# 🚀 Ule - Sistema de Gestión de Seguridad Social

<div align="center">

  **Sistema integral de gestión de seguridad social para Colombia**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.12-2D3748)](https://www.prisma.io/)
</div>

---

## 📖 Descripción

**Ule** es una plataforma moderna y eficiente para la gestión de seguridad social en Colombia. Diseñada con las mejores prácticas de desarrollo y una experiencia de usuario inspirada en N26.

### ✨ Características principales

- 🎨 Diseño moderno inspirado en N26
- 🔐 Seguridad empresarial desde el inicio
- ♿ Accesibilidad WCAG 2.1 AA
- 📱 Responsive design mobile-first
- 🌙 Soporte para dark mode
- 🚀 Optimizado para rendimiento

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript 5.4
- **Estilos:** Tailwind CSS 3.4
- **Base de datos:** PostgreSQL + Prisma ORM
- **Validación:** Zod
- **Testing:** Jest + Testing Library
- **Iconos:** Lucide React

---

## 📋 Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** >= 18.17.0
- **npm** >= 9.0.0 o **pnpm** >= 8.0.0
- **PostgreSQL** >= 14
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ule.git
cd ule
```

### 2. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de base de datos.

### 4. Configurar base de datos

```bash
# Crear las tablas
npm run db:push

# (Opcional) Poblar con datos de ejemplo
npm run db:seed
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```
ule/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   ├── api/               # API Routes
│   └── layout.tsx         # Layout principal
├── components/
│   ├── ui/                # Componentes del design system
│   ├── forms/             # Componentes de formularios
│   └── layout/            # Componentes de layout
├── lib/
│   ├── design-tokens.ts   # Tokens de diseño
│   ├── theme.ts           # Configuración del tema
│   ├── utils.ts           # Utilidades generales
│   └── db.ts              # Cliente Prisma
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos de ejemplo
├── public/                # Assets estáticos
├── styles/                # Estilos globales
└── types/                 # Definiciones TypeScript
```

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build para producción
npm run start            # Iniciar servidor de producción

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run format           # Formatear con Prettier
npm run type-check       # Validar tipos TypeScript

# Base de datos
npm run db:push          # Sincronizar schema con DB
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Poblar base de datos

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch
```

---

## 🎨 Sistema de Diseño

Ule utiliza un sistema de diseño personalizado inspirado en N26:

- **Colores:** Turquesa primary (#00A19A), acentos coral (#FF6B6B)
- **Tipografía:** Inter (Google Fonts)
- **Espaciado:** Sistema base de 4px
- **Bordes:** Rounded generosos (12px, 16px)
- **Sombras:** Suaves y modernas

Ver `/lib/design-tokens.ts` para detalles completos.

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 👥 Equipo

Desarrollado con ❤️ por el equipo de Ule

---

## 📞 Soporte

¿Preguntas? Contacta a: soporte@ule.app
