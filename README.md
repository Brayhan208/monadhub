# MonadHub - Gobernanza, Votaciones On-Chain y Web3 dApp

MonadHub es una plataforma descentralizada (dApp) construida sobre la red Monad Testnet y sincronizada con Supabase Cloud. Permite a la comunidad participar en procesos de gobernanza inmutables mediante votaciones criptográficamente protegidas, campañas de crowdfunding transparente ("La Vaca") y la emisión/verificación de Certificados Digitales acreditados en la blockchain.

---

## Características Principales

* **Votaciones On-Chain y Off-Chain:** Creación de encuestas con generación automática de Slugs únicos, temporizadores dinámicos, cálculo automático de porcentajes, códigos QR de acceso rápido y firmas digitales con MetaMask.
* **Crowdfunding ("La Vaca"):** Colectas comunitarias transparentes en el token nativo MON con seguimiento en tiempo real del progreso de recaudación y aportes directos mediante Smart Contract.
* **Certificados Digitales:** Emisión y verificación inmutable de acreditaciones Web3 asignadas directamente a direcciones de billeteras.
* **Autenticación y Perfil Persistente:** Registro e inicio de sesión con persistencia de sesión mediante localStorage, autocalculador de edad, autogenerador de usuario a partir del correo, vinculación/desvinculación dinámica de billeteras Web3 y panel de edición de datos personales.
* **Panel de Administración:** Gestión centralizada de usuarios registrados y moderación de contenidos para cuentas con rol de Administrador.

---

## Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+ Vanilla) | Interfaz SPA responsiva con arquitectura modular. |
| **Web3 Library** | Ethers.js v5 (UMD) | Comunicación con RPC y Smart Contracts vía window.ethereum. |
| **Blockchain** | Monad Testnet (Chain ID 10143) | Red de ejecución EVM de alto rendimiento. |
| **Base de Datos** | Supabase Cloud (PostgreSQL) | Persistencia relacional con políticas Row Level Security (RLS). |
| **Librerías Auxiliares** | QRCode.js, FontAwesome v6 | Generación gráfica de códigos QR e iconografía. |
| **Hosting & CI/CD** | Vercel & GitHub Actions | Despliegue continuo con HTTPS para entorno de producción. |

---

## Configuración de la Red Blockchain (Monad Testnet)

Para interactuar con los contratos inteligentes de MonadHub, tu billetera Web3 (MetaMask u otra compatible) debe estar configurada con los siguientes parámetros:

* **Nombre de la Red:** Monad Testnet
* **RPC URL:** https://testnet-rpc.monad.xyz/
* **Chain ID:** 10143 (Hexadecimal: 0x279f)
* **Símbolo de Moneda:** MON
* **Explorador de Bloques:** https://testnet.monadexplorer.com/

---

## Smart Contract Desplegado

El contrato inteligente central que gestiona la lógica de gobernanza, colectas y certificados se encuentra desplegado en Monad Testnet.

* **Dirección del Contrato:** `0x3b741698A2b4399bAB93368722afa5e946274937`

### Funciones Principales del Contrato (ABI)

```solidity
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
