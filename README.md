⚡ MonadHub — Gobernanza, Votaciones On-Chain & Web3 dApp

MonadHub es una plataforma descentralizada (dApp) construida sobre Monad Testnet y sincronizada con Supabase Cloud. Permite a la comunidad participar en procesos de gobernanza inmutables mediante votaciones criptográficamente protegidas, campañas de crowdfunding transparente ("La Vaca") y la emisión/verificación de Certificados Digitales acreditados on-chain.

🚀 Características Principales

⚬ 🗳️ Votaciones On-Chain y Off-Chain: Creación de encuestas con generación automática de Slugs únicos (/votacion/mi-encuesta-x8f2), temporizadores dinámicos, cálculo automático de porcentajes, códigos QR de acceso rápido y firmas digitales con MetaMask.
⚬ 🐄 Crowdfunding ("La Vaca"): Colectas comunitarias transparentes en token native MON con seguimiento en tiempo real del progreso de recaudación y aportes directos mediante Smart Contract.
⚬ 🎓 Certificados Digitales: Emisión y verificación inmutable de acreditaciones Web3 asignadas directamente a direcciones de billeteras.
⚬ 👤 Autenticación & Perfil Persistente: Registro e inicio de sesión con encriptación de sesión en localStorage, vinculación/desvinculación dinámica de billeteras Web3 y panel de edición de datos personales.
⚬ 🛡️ Panel Privilegiado de Administración: Gestión centralizada de usuarios registrados y moderación de contenidos para cuentas con rol de Administrador.

🛠️ Stack Tecnológico

Capa	Tecnología	Descripción
Frontend	HTML5, CSS3, JavaScript (ES6+ Vanilla)	Interfaz SPA responsiva con tema oscuro neón.
Web3 Library	Ethers.js v5 (UMD)	Comunicación con RPC y Smart Contracts via window.ethereum.
Blockchain	Monad Testnet (Chain ID 10143)	Red de ejecución EVM de alto rendimiento.
Base de Datos	Supabase Cloud (PostgreSQL)	Persistencia relacional con políticas Row Level Security (RLS).
Librerías Auxiliares	QRCode.js, FontAwesome v6	Generación gráfica de QR y fuentes de iconografía.
Hosting & CI/CD	Vercel & GitHub Actions	Despliegue continuo con HTTPS para producción.

🌐 Configuración de la Red Blockchain (Monad Testnet)

Para interactuar con los contratos inteligentes de MonadHub, MetaMask u otra billetera Web3 debe estar configurada con los siguientes parámetros:

⚬ Nombre de la Red: Monad Testnet
⚬ RPC URL: [https://testnet-rpc.monad.xyz/](https://testnet-rpc.monad.xyz/)
⚬ Chain ID: 10143 (Hexadecimal: 0x279f)
⚬ Símbolo de Moneda: MON
⚬ Explorador de Bloques: [https://testnet.monadexplorer.com/](https://testnet.monadexplorer.com/)

📜 Smart Contract Desplegado

El contrato inteligente central que gestiona la lógica de gobernanza, colectas y certificados se encuentra desplegado y verificado en Monad Testnet.

⚬ Dirección del Contrato (CONTRACT_ADDRESS):
  0x3b741698A2b4399bAB93368722afa5e946274937

Funciones Principales del Contrato (ABI)

// 1. Crear Votación On-Chain
function crearVotacion(
    string memory _titulo, 
    string[] memory _opcionesTexto, 
    uint256 _duracionMinutos
) external returns (uint256);

// 2. Emitir Voto
function votar(
    uint256 _pollId, 
    uint256 _opcionIndex
) external;

// 3. Crear Colecta (La Vaca)
function crearVaca(
    string memory _titulo, 
    uint256 _targetAmountWei, 
    uint256 _duracionMinutos
) external returns (uint256);

// 4. Aportar MON a Colecta
function aportarAVaca(
    uint256 _vacaId
) external payable;

// 5. Emitir Certificado Digital
function emitirCertificado(
    address _destinatario, 
    string memory _titulo
) external returns (uint256);


Eventos Emitidos On-Chain

⚬ PollCreated(uint256 indexed pollId, address indexed creator, string title, uint256 endsAt)
⚬ Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex)
⚬ VacaCreated(uint256 indexed vacaId, address indexed creator, string title, uint256 targetAmount)
⚬ VacaFunded(uint256 indexed vacaId, address indexed funder, uint256 amount)
⚬ CertificateIssued(uint256 indexed certId, address indexed recipient, string title)

🗄️ Esquema de Base de Datos (Supabase SQL)

Ejecuta el siguiente script en el SQL Editor de Supabase Cloud para inicializar las tablas, extensiones, políticas RLS de acceso público y el usuario administrador semilla:

-- 1. ELIMINAR TABLAS PREVIAS EN ORDEN CORRECTO
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.poll_options CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;
DROP TABLE IF EXISTS public.vacas CASCADE;
DROP TABLE IF EXISTS public.certificados CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. HABILITAR EXTENSIÓN UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. TABLA DE USUARIOS
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    password_hash VARCHAR(255),
    username VARCHAR(100) UNIQUE NOT NULL,
    wallet_address VARCHAR(42),
    role VARCHAR(50) DEFAULT 'Votante',
    full_name VARCHAR(255),
    nombre VARCHAR(255),
    bio TEXT,
    birth_date DATE,
    age INT DEFAULT 0,
    avatar_url VARCHAR(255) DEFAULT 'avatar1.png',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE VOTACIONES (POLLS)
CREATE TABLE public.polls (
    id BIGSERIAL PRIMARY KEY,
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    on_chain_id NUMERIC,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE OPCIONES DE VOTACIÓN
CREATE TABLE public.poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id BIGINT REFERENCES public.polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_index INT DEFAULT 0,
    votes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE REGISTRO DE VOTOS
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id BIGINT REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    voter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    wallet_address VARCHAR(42),
    voter_wallet VARCHAR(42),
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voter_per_poll UNIQUE(poll_id, user_id)
);

-- 7. TABLA DE COLECTAS (LA VACA)
CREATE TABLE public.vacas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_amount NUMERIC(18, 4) NOT NULL,
    current_amount NUMERIC(18, 4) DEFAULT 0,
    collected_amount NUMERIC(18, 4) DEFAULT 0,
    ends_at TIMESTAMPTZ NOT NULL,
    creator_wallet VARCHAR(42),
    on_chain_id NUMERIC,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE CERTIFICADOS
CREATE TABLE public.certificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issuer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255),
    recipient_address VARCHAR(42),
    recipient_wallet VARCHAR(42),
    title VARCHAR(255) NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    on_chain_id NUMERIC,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONFIGURAR SEGURIDAD (RLS - ROW LEVEL SECURITY)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a polls" ON public.polls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a poll_options" ON public.poll_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a votes" ON public.votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a vacas" ON public.vacas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a certificados" ON public.certificados FOR ALL USING (true) WITH CHECK (true);

-- 10. USUARIO ADMINISTRADOR SEMILLA
INSERT INTO public.users (
    id, email, password, password_hash, username, wallet_address, role, full_name, nombre, bio, birth_date, age, avatar_url
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@monadhub.xyz',
    '1234',
    '1234',
    'admin',
    '0x5381c67C020ca604cb9e60E07f636E43D20489bE',
    'Administrador',
    'Administrador del Sistema',
    'Administrador MonadHub',
    'Cuenta semilla de administración',
    '2026-01-01',
    25,
    'avatar1.png'
) ON CONFLICT (username) DO NOTHING;


📁 Estructura del Proyecto

monadhub/
├── index.html          # Estructura HTML5 SPA, modales y referencias CDN
├── style.css           # Estilos globales, variables CSS, layout responsivo y efectos neón
├── app.js              # Lógica principal Web3 (Ethers.js), Supabase Client y handlers DOM
└── README.md           # Documentación técnica completa del proyecto


💻 Instalación y Despliegue Local

1. Clonar el repositorio:
   git clone https://github.com/tu-usuario/monadhub.git
   cd monadhub
   
2. Configurar Credenciales:
   Abre el archivo app.js y asegúrate de configurar las variables de Supabase:
   const SUPABASE_URL = "https://tu-proyecto.supabase.co";
   const SUPABASE_KEY = "tu-supabase-anon-key";
   
3. Ejecutar Localmente:
   Puedes abrir index.html directamente en tu navegador o usar un servidor de desarrollo local como Live Server en VS Code o npx serve.

☁️ Despliegue en Producción (Vercel)

El proyecto está optimizado para su despliegue en plataformas Jamstack con HTTPS:

1. Conecta tu cuenta de GitHub con Vercel.
2. Importa el repositorio monadhub.
3. Deja la configuración de Build Command en blanco (al ser una dApp estática Vanilla JS).
4. Haz clic en Deploy. Vercel compilará la aplicación y generará la URL pública (ejemplo: [https://monadhub.vercel.app](https://monadhub.vercel.app)).

🔑 Credenciales por Defecto (Entorno Pruebas)

⚬ Usuario Administrador: admin
⚬ Contraseña: 1234
