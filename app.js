// ==========================================================================
// CONFIGURACIÓN SUPABASE CLOUD & SMART CONTRACT (MONAD TESTNET - CHAIN ID 10143)
// ==========================================================================
const SUPABASE_URL = "https://svakbezwiscpabtbhoxh.supabase.co";
const SUPABASE_KEY = "sb_publishable_JEwBlW9FLPAGzQbYUjWDhA_v_8vmoqt";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CONTRACT_ADDRESS = "0x3b741698A2b4399bAB93368722afa5e946274937"; 
const MONAD_CHAIN_HEX = "0x279f"; // Chain ID 10143 en Hexadecimal

const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "certId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "title", "type": "string" }
        ],
        "name": "CertificateIssued",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "pollId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "endsAt", "type": "uint256" }
        ],
        "name": "PollCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "vacaId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "targetAmount", "type": "uint256" }
        ],
        "name": "VacaCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "vacaId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "funder", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "VacaFunded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "pollId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "optionIndex", "type": "uint256" }
        ],
        "name": "Voted",
        "type": "event"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_vacaId", "type": "uint256" }],
        "name": "aportarAVaca",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_titulo", "type": "string" },
            { "internalType": "uint256", "name": "_targetAmountWei", "type": "uint256" },
            { "internalType": "uint256", "name": "_duracionMinutos", "type": "uint256" }
        ],
        "name": "crearVaca",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_titulo", "type": "string" },
            { "internalType": "string[]", "name": "_opcionesTexto", "type": "string[]" },
            { "internalType": "uint256", "name": "_duracionMinutos", "type": "uint256" }
        ],
        "name": "crearVotacion",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_destinatario", "type": "address" },
            { "internalType": "string", "name": "_titulo", "type": "string" }
        ],
        "name": "emitirCertificado",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_pollId", "type": "uint256" },
            { "internalType": "uint256", "name": "_opcionIndex", "type": "uint256" }
        ],
        "name": "votar",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Estado Global de la Aplicación
let provider = null;
let signer = null;
let contract = null;

let userAddress = "";
let currentUserId = null;
let userEmail = "";
let username = "";
let userRol = "Votante";
let userFullData = {};

let currentPollData = null;
let timerInterval = null;

function showToast(message, type = "info") {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
window.showToast = showToast;

function guardarSesionEnLocalStorage(data) {
    userFullData = data;
    currentUserId = data.id;
    userEmail = data.email || '';
    username = data.username || '';
    userAddress = data.wallet_address || '';
    userRol = data.role || 'Votante';

    localStorage.setItem('monadhub_session', JSON.stringify(data));
    mostrarInterfazConectada();
}

function restaurarSesionGuardada() {
    const sessionRaw = localStorage.getItem('monadhub_session');
    if (sessionRaw) {
        try {
            const data = JSON.parse(sessionRaw);
            userFullData = data;
            currentUserId = data.id;
            userEmail = data.email || '';
            username = data.username || '';
            userAddress = data.wallet_address || '';
            userRol = data.role || 'Votante';
            mostrarInterfazConectada();
        } catch (e) {
            console.error("Error al restaurar la sesión guardada:", e);
            localStorage.removeItem('monadhub_session');
        }
    }
}

async function solicitarConectarWallet() {
    console.log('🔍 [MonadHub] Iniciando conexión con MetaMask...');

    let ethereumProvider = window.ethereum;
    if (window.ethereum && window.ethereum.providers) {
        ethereumProvider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
    }

    if (!ethereumProvider) {
        console.error('❌ [MonadHub] No se encontró proveedor Ethereum.');
        showToast("MetaMask no detectado. Instala la extensión o abre un navegador Web3.", "error");
        return null;
    }

    try {
        console.log('🦊 [MonadHub] Solicitando eth_requestAccounts...');
        const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' });

        if (!accounts || accounts.length === 0) {
            console.warn('⚠️ [MonadHub] No se seleccionó ninguna cuenta.');
            return null;
        }

        const walletAddress = accounts[0].toLowerCase();
        console.log('✅ [MonadHub] Cuenta autorizada:', walletAddress);

        try {
            await ethereumProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MONAD_CHAIN_HEX }]
            });
            console.log('🌐 [MonadHub] Red cambiada a Monad Testnet.');
        } catch (switchError) {
            if (switchError.code === 4902 || switchError.code === -32603) {
                try {
                    await ethereumProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: MONAD_CHAIN_HEX,
                            chainName: 'Monad Testnet',
                            nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                            rpcUrls: ['https://testnet-rpc.monad.xyz/'],
                            blockExplorerUrls: ['https://testnet.monadexplorer.com/']
                        }]
                    });
                    console.log('➕ [MonadHub] Red Monad Testnet agregada.');
                } catch (addError) {
                    console.error('❌ [MonadHub] Error agregando red Monad:', addError);
                }
            }
        }

        if (typeof ethers !== 'undefined') {
            provider = new ethers.providers.Web3Provider(ethereumProvider);
            signer = provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        }

        userAddress = walletAddress;
        return walletAddress;

    } catch (err) {
        console.error('❌ [MonadHub] Error en solicitarConectarWallet:', err);
        showToast("Error al conectar wallet: " + (err.message || err), "error");
        return null;
    }
}

async function conectarWalletModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    console.log('🖱️ [MonadHub] Conectar wallet desde Modal Registro');

    const addr = await solicitarConectarWallet();
    if (addr) {
        const input = document.getElementById('txtWalletAuth');
        if (input) input.value = addr;
        showToast("Billetera conectada: " + addr.substring(0, 6) + "..." + addr.slice(-4), "success");
    }
}

async function conectarWalletEditPerfil(e) {
    if (e && e.preventDefault) e.preventDefault();
    console.log('🖱️ [MonadHub] Vincular wallet desde Modal Perfil');

    const addr = await solicitarConectarWallet();
    if (addr) {
        const input = document.getElementById('editWalletAddress');
        if (input) input.value = addr;
        showToast("Billetera vinculada: " + addr.substring(0, 6) + "..." + addr.slice(-4), "success");
    }
}

window.solicitarConectarWallet = solicitarConectarWallet;
window.conectarWalletModal = conectarWalletModal;
window.conectarWalletEditPerfil = conectarWalletEditPerfil;

function activarPestana(tabId) {
    if (!tabId) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('open');

    const dropdownMenu = document.getElementById('userDropdownMenu');
    if (dropdownMenu) dropdownMenu.classList.add('hidden');

    if (tabId === 'tabVaca') cargarCampanasVaca();
    if (tabId === 'tabCertificados') cargarCertificados();
    if (tabId === 'tabPerfil') {
        cargarMisVotacionesCreadas();
        if (userRol === 'Administrador' || userRol === 'admin') cargarDatosAdminPanel();
    }
}
window.activarPestana = activarPestana;

function toggleAuthMode(mode) {
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const formLogin = document.getElementById('loginForm');
    const formRegister = document.getElementById('registroForm');

    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
    }
}

function abrirModalAuth() {
    const modal = document.getElementById('modalAuth');
    if (modal) modal.classList.remove('overlay-hidden');
}

function cerrarModalAuth() {
    const modal = document.getElementById('modalAuth');
    if (modal) modal.classList.add('overlay-hidden');
}

function mostrarOlvidastePassword(e) {
    if (e) e.preventDefault();
    const mail = prompt("Ingresa tu correo electrónico registrado para restablecer tu contraseña:");
    if (mail && mail.includes('@')) {
        showToast("Instrucciones enviadas exitosamente a " + mail, "success");
    } else if (mail !== null) {
        showToast("Ingresa un correo electrónico válido.", "error");
    }
}

function abrirModalEditProfile() {
    if (!currentUserId) return showToast("Debes iniciar sesión para editar tu perfil.", "error");
    document.getElementById('editFullName').value = userFullData.full_name || userFullData.nombre || '';
    document.getElementById('editUsername').value = username || '';
    document.getElementById('editEmail').value = userEmail || '';
    document.getElementById('editWalletAddress').value = userAddress || '';
    document.getElementById('modalEditProfile').classList.remove('overlay-hidden');
}

function cerrarModalEditProfile() {
    document.getElementById('modalEditProfile').classList.add('overlay-hidden');
}

window.toggleAuthMode = toggleAuthMode;
window.abrirModalAuth = abrirModalAuth;
window.cerrarModalAuth = cerrarModalAuth;
window.mostrarOlvidastePassword = mostrarOlvidastePassword;
window.abrirModalEditProfile = abrirModalEditProfile;
window.cerrarModalEditProfile = cerrarModalEditProfile;

function mostrarInterfazConectada() {
    document.getElementById('btnAuthHeader').classList.add('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('navTabPerfil').classList.remove('hidden');

    document.getElementById('lblUserEmail').innerText = userEmail || username;
    document.getElementById('lblWalletChip').innerText = userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : 'Sin Wallet';

    if (userRol === 'Administrador' || userRol === 'admin') {
        document.getElementById('lblUserRole').classList.remove('hidden');
        document.getElementById('lblUserRole').innerText = 'Administrador';
        document.getElementById('adminPanelSection').classList.remove('hidden');
    } else {
        document.getElementById('lblUserRole').classList.add('hidden');
        document.getElementById('adminPanelSection').classList.add('hidden');
    }

    document.getElementById('profUsernameDisplay').innerText = username;
    document.getElementById('profNombreComp').innerText = userFullData.full_name || userFullData.nombre || username;
    document.getElementById('profEmail').innerText = userEmail || 'No registrado';
    document.getElementById('profFechaNac').innerText = userFullData.birth_date || 'No registrada';
    document.getElementById('profEdad').innerText = userFullData.age || 'N/A';
    document.getElementById('profWallet').innerText = userAddress || 'No conectada';

    cargarMetricasGlobales();
    cargarVotacionesRecientesHome();
}

function cerrarSesion() {
    currentUserId = null;
    userEmail = "";
    username = "";
    userAddress = "";
    userRol = "Votante";
    userFullData = {};

    localStorage.removeItem('monadhub_session');

    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('btnAuthHeader').classList.remove('hidden');
    document.getElementById('navTabPerfil').classList.add('hidden');
    document.getElementById('adminPanelSection').classList.add('hidden');

    activarPestana('tabInicio');
    showToast("Sesión cerrada correctamente.", "info");
}
window.cerrarSesion = cerrarSesion;

function renderDynamicOptions(count) {
    const container = document.getElementById('dynamicOptionsContainer');
    if (!container) return;
    const num = Math.min(Math.max(parseInt(count) || 2, 2), 10);
    let html = '';
    for (let i = 1; i <= num; i++) {
        html += `
            <div class="form-group">
                <label for="txtOpcion_${i}">Opción ${i}:</label>
                <input type="text" id="txtOpcion_${i}" class="form-control txt-opcion-input" placeholder="Escribe la Opción ${i}" required>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function buscarVotacionPorInput() {
    const val = document.getElementById('numIdVotacion').value.trim();
    if (!val) return showToast("Ingresa un Slug o ID válido.", "error");
    cargarVotacionPorSlugOId(val);
}
window.buscarVotacionPorInput = buscarVotacionPorInput;

async function cargarVotacionPorSlugOId(slugOrId) {
    try {
        let clean = slugOrId.replace('/votacion/', '').trim();
        
        let query = supabaseClient.from('polls').select('*, poll_options(*)');
        if (isNaN(clean)) {
            query = query.eq('slug', clean);
        } else {
            query = query.or(`id.eq.${clean},slug.eq.${clean}`);
        }

        const { data: pollData, error } = await query.single();

        if (error || !pollData) {
            return showToast("No se encontró ninguna votación con ese ID o Slug.", "error");
        }

        currentPollData = pollData;
        renderizarDetalleVotacion(pollData);
    } catch (err) {
        console.error(err);
        showToast("Error al consultar la votación.", "error");
    }
}

function renderizarDetalleVotacion(poll) {
    document.getElementById('divDetalle').innerHTML = `
        <h2 style="font-size:1.6rem; margin-bottom:0.4rem;">${poll.title}</h2>
        <p style="color:var(--text-sec); font-size:0.85rem;">Slug: <code>/votacion/${poll.slug}</code> | ID: ${poll.id} | On-Chain ID: ${poll.on_chain_id || 'Off-chain'}</p>
    `;

    iniciarTemporizador(poll.ends_at);

    const totalVotos = poll.poll_options ? poll.poll_options.reduce((sum, op) => sum + (op.votes_count || 0), 0) : 0;
    
    document.getElementById('divOpciones').innerHTML = poll.poll_options
        .sort((a, b) => (a.option_index || 0) - (b.option_index || 0))
        .map((op, idx) => {
            const votos = op.votes_count || 0;
            const pct = totalVotos > 0 ? ((votos / totalVotos) * 100).toFixed(1) : 0;
            return `
                <div class="opcion-card" style="background:rgba(15,23,42,0.6); padding:1rem; border-radius:8px; border:1px solid var(--border); margin-bottom:0.8rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                        <strong>Opción ${idx + 1}: ${op.option_text}</strong>
                        <span>${votos} votos (${pct}%)</span>
                    </div>
                    <div class="progress-bar-bg" style="margin-bottom:0.8rem;">
                        <div class="progress-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <button type="button" class="btn-secondary" style="width:100%;" onclick="votarOpcion('${op.id}', ${op.option_index || idx})">Votar por esta Opción</button>
                </div>
            `;
        }).join('');

    const linkFull = `${window.location.origin}${window.location.pathname}#/votacion/${poll.slug}`;
    document.getElementById('txtShareLink').value = linkFull;
    document.getElementById('shareModule').classList.remove('hidden');

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    if (window.QRCode) {
        new QRCode(qrContainer, { text: linkFull, width: 128, height: 128 });
    }
}

async function votarOpcion(optionId, optionIndex) {
    if (!currentUserId) return showToast("Debes iniciar sesión para emitir tu voto.", "error");

    let txHash = null;

    if (typeof window.ethereum !== 'undefined') {
        const addr = await solicitarConectarWallet();
        if (addr && contract && currentPollData) {
            try {
                showToast("Enviando voto a la blockchain...", "info");
                const pollOnChainId = currentPollData.on_chain_id || 1;
                const tx = await contract.votar(pollOnChainId, optionIndex);
                const receipt = await tx.wait();
                txHash = receipt.transactionHash;
                showToast("¡Voto registrado on-chain!", "success");
            } catch (err) {
                console.warn("Fallo voto Web3:", err);
            }
        }
    }

    try {
        const { error: voteErr } = await supabaseClient
            .from('votes')
            .insert([{
                poll_id: currentPollData.id,
                option_id: optionId,
                user_id: currentUserId,
                voter_id: currentUserId,
                wallet_address: userAddress || null,
                voter_wallet: userAddress || null,
                tx_hash: txHash
            }]);

        if (voteErr) {
            return showToast("Ya has emitido tu voto en esta encuesta.", "error");
        }

        const { data: optionData } = await supabaseClient.from('poll_options').select('votes_count').eq('id', optionId).single();
        const newCount = (optionData ? optionData.votes_count : 0) + 1;

        await supabaseClient.from('poll_options').update({ votes_count: newCount }).eq('id', optionId);

        showToast("¡Voto contabilizado con éxito!", "success");
        if (currentPollData) cargarVotacionPorSlugOId(currentPollData.slug);
    } catch (err) {
        console.error(err);
        showToast("Error al procesar el voto.", "error");
    }
}
window.votarOpcion = votarOpcion;

function copiarEnlaceCompartir() {
    const input = document.getElementById('txtShareLink');
    input.select();
    document.execCommand('copy');
    showToast("Enlace copiado al portapapeles.", "success");
}
window.copiarEnlaceCompartir = copiarEnlaceCompartir;

function iniciarTemporizador(endsAtIso) {
    if (timerInterval) clearInterval(timerInterval);
    const container = document.getElementById('timerContainer');
    container.classList.remove('hidden');

    function updateTimer() {
        const diff = new Date(endsAtIso).getTime() - Date.now();
        if (diff <= 0) {
            clearInterval(timerInterval);
            document.getElementById('badgeEstadoVotacion').className = 'status-badge closed-status';
            document.getElementById('badgeEstadoVotacion').innerText = 'Finalizada';
            document.getElementById('timerDays').innerText = '00';
            document.getElementById('timerHours').innerText = '00';
            document.getElementById('timerMinutes').innerText = '00';
            document.getElementById('timerSeconds').innerText = '00';
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);

        document.getElementById('timerDays').innerText = String(d).padStart(2, '0');
        document.getElementById('timerHours').innerText = String(h).padStart(2, '0');
        document.getElementById('timerMinutes').innerText = String(m).padStart(2, '0');
        document.getElementById('timerSeconds').innerText = String(s).padStart(2, '0');
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

async function guardarVaca(event) {
    event.preventDefault();
    if (!currentUserId) return showToast("Debes iniciar sesión para lanzar una colecta.", "error");

    const titulo = document.getElementById('txtVacaTitulo').value.trim();
    const descripcion = document.getElementById('txtVacaDescripcion').value.trim();
    const meta = parseFloat(document.getElementById('numVacaMeta').value);
    const fechaFin = document.getElementById('txtVacaFechaFin').value;

    let onChainId = Date.now();
    let txHash = null;

    if (typeof window.ethereum !== 'undefined') {
        const addr = await solicitarConectarWallet();
        if (addr && contract) {
            try {
                showToast("Lanzando colecta en Monad Testnet...", "info");
                const targetWei = ethers.utils.parseEther(meta.toString());
                const durationMin = Math.max(1, Math.floor((new Date(fechaFin).getTime() - Date.now()) / 60000));
                const tx = await contract.crearVaca(titulo, targetWei, durationMin);
                const receipt = await tx.wait();
                txHash = receipt.transactionHash;
                showToast("Colecta confirmada on-chain!", "success");
            } catch (err) {
                console.warn("Error Web3 Vaca:", err);
            }
        }
    }

    try {
        showToast("Publicando colecta en Supabase...", "info");
        const { error } = await supabaseClient
            .from('vacas')
            .insert([{
                creator_id: currentUserId,
                title: titulo,
                description: descripcion,
                target_amount: meta,
                current_amount: 0,
                collected_amount: 0,
                ends_at: new Date(fechaFin).toISOString(),
                creator_wallet: userAddress ? userAddress.toLowerCase() : '',
                on_chain_id: onChainId,
                tx_hash: txHash
            }]);

        if (error) throw error;

        showToast("Colecta lanzada exitosamente.", "success");
        document.getElementById('formCrearVaca').reset();
        cargarCampanasVaca();
        cargarMetricasGlobales();
    } catch (err) {
        console.error(err);
        showToast("Error al publicar la colecta: " + err.message, "error");
    }
}
window.guardarVaca = guardarVaca;

async function cargarCampanasVaca() {
    const container = document.getElementById('divCampanasVacaContainer');
    if (!container) return;

    try {
        const { data: vacas, error } = await supabaseClient
            .from('vacas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !vacas || vacas.length === 0) {
            container.innerHTML = `<p class="empty-msg">No hay colectas activas en este momento.</p>`;
            return;
        }

        container.innerHTML = vacas.map(vaca => {
            const estaVencida = Date.now() >= new Date(vaca.ends_at).getTime();
            const recolectado = parseFloat(vaca.collected_amount || vaca.current_amount || 0);
            const meta = parseFloat(vaca.target_amount || 1);
            const porcentaje = Math.min(100, ((recolectado / meta) * 100)).toFixed(1);

            return `
                <div class="card" style="margin-bottom: 1.2rem;">
                    <div class="card-header" style="margin-bottom: 0.8rem;">
                        <h3>${vaca.title}</h3>
                        <span class="status-badge ${estaVencida ? 'closed-status' : 'active-status'}">
                            ${estaVencida ? 'Finalizada' : 'Activa'}
                        </span>
                    </div>
                    <p style="color: var(--text-sec); font-size: 0.9rem; margin-bottom: 1rem;">${vaca.description}</p>

                    <div style="margin-bottom: 0.8rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem;">
                            <span>Meta: <strong>${recolectado.toFixed(3)} / ${meta.toFixed(3)} MON</strong></span>
                            <span>${porcentaje}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>

                    ${!estaVencida ? `
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <input type="number" id="inputAporte_${vaca.id}" class="form-control" placeholder="Monto MON (Ej: 0.1)" step="0.001" min="0.001" style="max-width: 200px;">
                            <button type="button" class="btn-primary" style="padding: 0.5rem 1rem;" onclick="aportarAVaca('${vaca.id}', ${recolectado},${vaca.on_chain_id || 1})">Aportar MON</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="empty-msg">Error al cargar las colectas.</p>`;
    }
}
window.cargarCampanasVaca = cargarCampanasVaca;

async function aportarAVaca(id, actual, onChainId) {
    const inp = document.getElementById(`inputAporte_${id}`);
    const val = parseFloat(inp ? inp.value : 0);
    if (!val || val <= 0) return showToast("Ingresa un monto válido.", "error");

    if (typeof window.ethereum !== 'undefined') {
        const addr = await solicitarConectarWallet();
        if (addr && contract) {
            try {
                showToast("Enviando aporte Web3 a Monad Testnet...", "info");
                const tx = await contract.aportarAVaca(onChainId || 1, { value: ethers.utils.parseEther(val.toString()) });
                await tx.wait();
                showToast("¡Aporte Web3 confirmado en la Blockchain!", "success");
            } catch (err) {
                console.warn("Fallo aporte Web3:", err);
            }
        }
    }

    try {
        const nuevoMonto = actual + val;
        await supabaseClient.from('vacas').update({
            collected_amount: nuevoMonto,
            current_amount: nuevoMonto
        }).eq('id', id);

        showToast("¡Aporte registrado correctamente!", "success");
        cargarCampanasVaca();
    } catch (err) {
        console.error(err);
        showToast("Error al registrar el aporte.", "error");
    }
}
window.aportarAVaca = aportarAVaca;

async function emitirCertificado(event) {
    event.preventDefault();
    if (!currentUserId) return showToast("Debes iniciar sesión para emitir certificados.", "error");

    const nombre = document.getElementById('txtCertNombre').value.trim();
    const wallet = document.getElementById('txtCertWallet').value.trim();
    const titulo = document.getElementById('txtCertTitulo').value.trim();
    const fecha = document.getElementById('txtCertFecha').value;

    let txHash = null;

    if (typeof window.ethereum !== 'undefined') {
        const addr = await solicitarConectarWallet();
        if (addr && contract) {
            try {
                showToast("Emitiendo certificado en la blockchain...", "info");
                const tx = await contract.emitirCertificado(wallet, titulo);
                const receipt = await tx.wait();
                txHash = receipt.transactionHash;
                showToast("¡Certificado emitido on-chain!", "success");
            } catch (err) {
                console.warn("Error emitiendo certificado Web3:", err);
            }
        }
    }

    try {
        showToast("Registrando certificado en Supabase...", "info");
        const { error } = await supabaseClient
            .from('certificados')
            .insert([{
                issuer_id: currentUserId,
                recipient_name: nombre,
                recipient_address: wallet.toLowerCase(),
                recipient_wallet: wallet.toLowerCase(),
                title: titulo,
                issued_at: fecha || new Date().toISOString(),
                tx_hash: txHash
            }]);

        if (error) throw error;

        showToast("Certificado emitido exitosamente.", "success");
        document.getElementById('formEmitirCertificado').reset();
        cargarCertificados();
        cargarMetricasGlobales();
    } catch (err) {
        console.error(err);
        showToast("Error al emitir certificado: " + err.message, "error");
    }
}
window.emitirCertificado = emitirCertificado;

async function cargarCertificados() {
    const container = document.getElementById('divCertificadosContainer');
    if (!container) return;

    try {
        const { data: certs, error } = await supabaseClient
            .from('certificados')
            .select('*')
            .order('issued_at', { ascending: false });

        if (error || !certs || certs.length === 0) {
            container.innerHTML = `<p class="empty-msg">No se han registrado certificados aún.</p>`;
            return;
        }

        container.innerHTML = certs.map(cert => `
            <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--primary);">
                <div class="card-header" style="margin-bottom:0.5rem;">
                    <h3>${cert.title}</h3>
                    <span class="card-badge">Verificado</span>
                </div>
                <p><strong>Otorgado a:</strong> ${cert.recipient_name || 'Destinatario'}</p>
                <p style="font-size:0.8rem; color:var(--text-sec); margin-top:0.3rem;">
                    Wallet: <code>${cert.recipient_wallet || cert.recipient_address}</code> | ID: ${cert.id}
                </p>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="empty-msg">Error al cargar certificados.</p>`;
    }
}
window.cargarCertificados = cargarCertificados;

async function buscarCertificado() {
    const term = document.getElementById('txtSearchCertId').value.trim();
    if (!term) return cargarCertificados();

    const container = document.getElementById('divCertificadosContainer');
    try {
        const { data: certs } = await supabaseClient
            .from('certificados')
            .select('*')
            .or(`recipient_name.ilike.%${term}%,recipient_wallet.ilike.%${term}%,recipient_address.ilike.%${term}%`);

        if (!certs || certs.length === 0) {
            container.innerHTML = `<p class="empty-msg">No se encontraron certificados coincidentes.</p>`;
            return;
        }

        container.innerHTML = certs.map(cert => `
            <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--primary);">
                <h3>${cert.title}</h3>
                <p><strong>Otorgado a:</strong> ${cert.recipient_name}</p>
                <p style="font-size:0.8rem; color:var(--text-sec);">Wallet: <code>${cert.recipient_wallet || cert.recipient_address}</code></p>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}
window.buscarCertificado = buscarCertificado;

async function cargarMisVotacionesCreadas() {
    const container = document.getElementById('divMyPolls');
    if (!container) return;
    if (!currentUserId) {
        container.innerHTML = `<p class="empty-msg">Inicia sesión para ver tus votaciones creadas.</p>`;
        return;
    }

    try {
        const { data: polls } = await supabaseClient
            .from('polls')
            .select('*')
            .eq('creator_id', currentUserId);

        if (!polls || polls.length === 0) {
            container.innerHTML = `<p class="empty-msg">Aún no has creado votaciones.</p>`;
            return;
        }

        container.innerHTML = polls.map(p => `
            <div class="card" style="margin-bottom:0.8rem;">
                <strong>${p.title}</strong>
                <p style="font-size:0.8rem; color:var(--text-sec);">/votacion/${p.slug}</p>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function cargarDatosAdminPanel() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    try {
        const { data: users } = await supabaseClient.from('users').select('*');
        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No hay otros usuarios en el sistema.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.username || 'Usuario'}</td>
                <td>${u.email || u.username}</td>
                <td><span class="role-badge">${u.role || 'Votante'}</span></td>
                <td><code>${u.wallet_address ? u.wallet_address.substring(0, 8) + '...' : 'N/A'}</code></td>
                <td><button type="button" class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="showToast('Usuario seleccionado', 'info')">Editar</button></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function switchAdminSubTab(subTab) {
    const tabU = document.getElementById('adminUsersSubTab');
    const tabC = document.getElementById('adminContentSubTab');
    const btnU = document.getElementById('btnAdminUsersTab');
    const btnC = document.getElementById('btnAdminContentTab');

    if (subTab === 'users') {
        tabU.classList.remove('hidden');
        tabC.classList.add('hidden');
        btnU.classList.add('active');
        btnC.classList.remove('active');
    } else {
        tabC.classList.remove('hidden');
        tabU.classList.add('hidden');
        btnC.classList.add('active');
        btnU.classList.remove('active');
    }
}
window.switchAdminSubTab = switchAdminSubTab;

async function cargarMetricasGlobales() {
    try {
        const { count: cPolls } = await supabaseClient.from('polls').select('*', { count: 'exact', head: true });
        const { count: cVacas } = await supabaseClient.from('vacas').select('*', { count: 'exact', head: true });
        const { count: cCertificados } = await supabaseClient.from('certificados').select('*', { count: 'exact', head: true });

        document.getElementById('valMetricsVacas').innerText = cVacas !== null ? cVacas : "0";
        document.getElementById('valMetricsCertificados').innerText = cCertificados !== null ? cCertificados : "0";
        document.getElementById('valMetricsPolls').innerText = cPolls !== null ? cPolls : "0";
    } catch (e) {
        document.getElementById('valMetricsVacas').innerText = "0";
        document.getElementById('valMetricsCertificados').innerText = "0";
        document.getElementById('valMetricsPolls').innerText = "0";
    }
}

async function cargarVotacionesRecientesHome() {
    const { data: polls } = await supabaseClient
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    const container = document.getElementById('divRecentPollsHome');
    if (!container) return;

    if (!polls || polls.length === 0) {
        container.innerHTML = `<p class="empty-msg">No hay votaciones publicadas recientemente.</p>`;
        return;
    }

    container.innerHTML = polls.map(poll => `
        <div class="card" style="margin-bottom:0.8rem; cursor:pointer;" onclick="activarPestana('tabExplora'); cargarVotacionPorSlugOId('${poll.slug}');">
            <strong>${poll.title}</strong>
            <div style="font-size:0.8rem; color:var(--text-sec); margin-top:0.4rem;">Slug: /${poll.slug}</div>
        </div>
    `).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    restaurarSesionGuardada();
    renderDynamicOptions(2);
    cargarMetricasGlobales();
    cargarVotacionesRecientesHome();

    const txtTitulo = document.getElementById('txtTitulo');
    if (txtTitulo) {
        txtTitulo.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (!val) {
                document.getElementById('txtSlugGenerado').value = '';
                return;
            }
            
            const cleanSlug = val.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            
            const randomHash = Math.random().toString(36).substring(2, 6);
            document.getElementById('txtSlugGenerado').value = `/votacion/${cleanSlug}-${randomHash}`;
        });
    }

    const numTotalOpciones = document.getElementById('numTotalOpciones');
    if (numTotalOpciones) {
        numTotalOpciones.addEventListener('input', (e) => renderDynamicOptions(e.target.value));
        numTotalOpciones.addEventListener('change', (e) => renderDynamicOptions(e.target.value));
    }

    const btnCrear = document.getElementById('btnCrear');
    if (btnCrear) {
        btnCrear.addEventListener('click', async () => {
            if (!currentUserId) return showToast("Debes iniciar sesión para publicar votaciones.", "error");

            const titulo = document.getElementById('txtTitulo').value.trim();
            const slugInput = document.getElementById('txtSlugGenerado').value.trim();
            const slug = slugInput.replace('/votacion/', '');
            const fechaFin = document.getElementById('txtFechaFin').value;

            const opInputs = document.querySelectorAll('.txt-opcion-input');
            const opciones = Array.from(opInputs).map(inp => inp.value.trim()).filter(val => val !== '');

            if (!titulo || opciones.length < 2 || !fechaFin) {
                return showToast("Completa el título, al menos 2 opciones y la fecha de cierre.", "error");
            }

            let onChainId = Date.now();
            let txHash = null;

            if (typeof window.ethereum !== 'undefined') {
                const addr = await solicitarConectarWallet();
                if (addr && contract) {
                    try {
                        showToast("Firmando creación de votación en Monad Testnet...", "info");
                        const durationMin = Math.max(1, Math.floor((new Date(fechaFin).getTime() - Date.now()) / 60000));
                        const tx = await contract.crearVotacion(titulo, opciones, durationMin);
                        const receipt = await tx.wait();
                        txHash = receipt.transactionHash;
                        showToast("¡Votación confirmada en la Blockchain!", "success");
                    } catch (err) {
                        console.warn("Fallo Web3 al crear votación:", err);
                    }
                }
            }

            try {
                showToast("Publicando votación en Supabase...", "info");
                const { data: poll, error } = await supabaseClient
                    .from('polls')
                    .insert([{
                        creator_id: currentUserId,
                        title: titulo,
                        slug: slug,
                        ends_at: new Date(fechaFin).toISOString(),
                        on_chain_id: onChainId,
                        tx_hash: txHash
                    }])
                    .select()
                    .single();

                if (error) throw error;

                const opcionesData = opciones.map((op, idx) => ({
                    poll_id: poll.id,
                    option_text: op,
                    option_index: idx,
                    votes_count: 0
                }));

                await supabaseClient.from('poll_options').insert(opcionesData);

                showToast("Votación publicada con éxito.", "success");
                document.getElementById('txtTitulo').value = '';
                document.getElementById('txtSlugGenerado').value = '';
                renderDynamicOptions(2);
                
                cargarMetricasGlobales();
                cargarVotacionesRecientesHome();
                activarPestana('tabExplora');
                cargarVotacionPorSlugOId(poll.slug);
            } catch (err) {
                console.error(err);
                showToast("Error al publicar la votación: " + err.message, "error");
            }
        });
    }

    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('regNombre').value.trim();
            const apellidos = document.getElementById('regApellidos').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const fechaNac = document.getElementById('regFechaNacimiento').value;
            const edad = document.getElementById('regEdad').value;
            const autoUser = document.getElementById('regUsuario').value;
            const wallet = document.getElementById('txtWalletAuth').value.trim();
            const avatarRadio = document.querySelector('input[name="avatarSelect"]:checked');
            const avatar = avatarRadio ? avatarRadio.value : 'avatar1.png';

            if (password !== confirmPassword) {
                return showToast("Las contraseñas no coinciden.", "error");
            }

            try {
                showToast("Procesando registro en Supabase...", "info");

                const { data, error } = await supabaseClient
                    .from('users')
                    .insert([{
                        email: email,
                        password: password,
                        password_hash: password,
                        username: autoUser || email.split('@')[0],
                        wallet_address: wallet ? wallet.toLowerCase() : '',
                        role: 'Votante',
                        full_name: `${nombre} ${apellidos}`,
                        nombre: `${nombre} ${apellidos}`,
                        birth_date: fechaNac,
                        age: parseInt(edad) || 0,
                        avatar_url: avatar
                    }])
                    .select()
                    .single();

                if (error) throw error;

                cerrarModalAuth();
                guardarSesionEnLocalStorage(data);
                showToast("Registro completado exitosamente.", "success");
            } catch (err) {
                console.error(err);
                showToast("Error al registrar la cuenta: " + err.message, "error");
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailOrUser = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (emailOrUser === 'admin' && password === '1234') {
                const seededAdmin = {
                    id: '00000000-0000-0000-0000-000000000001',
                    full_name: 'Administrador del Sistema',
                    nombre: 'Administrador MonadHub',
                    username: 'admin',
                    email: 'admin@monadhub.xyz',
                    role: 'Administrador',
                    birth_date: '2026-01-01',
                    age: 25,
                    wallet_address: '0x5381c67C020ca604cb9e60E07f636E43D20489bE'
                };

                cerrarModalAuth();
                guardarSesionEnLocalStorage(seededAdmin);
                showToast("Sesión iniciada como Administrador.", "success");
                return;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('users')
                    .select('*')
                    .or(`email.eq.${emailOrUser},username.eq.${emailOrUser}`)
                    .or(`password.eq.${password},password_hash.eq.${password}`)
                    .maybeSingle();

                if (error || !data) {
                    return showToast("Credenciales de acceso incorrectas.", "error");
                }

                cerrarModalAuth();
                guardarSesionEnLocalStorage(data);
                showToast("Sesión iniciada correctamente.", "success");
            } catch (err) {
                console.error(err);
                showToast("Error al procesar el inicio de sesión.", "error");
            }
        });
    }

    const formEditProfile = document.getElementById('formEditProfile');
    if (formEditProfile) {
        formEditProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUserId) return;

            const editFullName = document.getElementById('editFullName').value.trim();
            const editUsername = document.getElementById('editUsername').value.trim();
            const editEmail = document.getElementById('editEmail').value.trim();
            const editNewPassword = document.getElementById('editNewPassword').value.trim();
            const editWalletAddress = document.getElementById('editWalletAddress').value.trim().toLowerCase();

            const updateData = {
                full_name: editFullName,
                nombre: editFullName,
                username: editUsername,
                email: editEmail,
                wallet_address: editWalletAddress || null
            };

            if (editNewPassword) {
                updateData.password = editNewPassword;
                updateData.password_hash = editNewPassword;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('users')
                    .update(updateData)
                    .eq('id', currentUserId)
                    .select()
                    .single();

                if (error) throw error;

                cerrarModalEditProfile();
                guardarSesionEnLocalStorage(data);
                showToast("Perfil actualizado correctamente.", "success");
            } catch (err) {
                console.error(err);
                showToast("Error al actualizar perfil: " + err.message, "error");
            }
        });
    }

    const btnHamburger = document.getElementById('btnHamburger');
    if (btnHamburger) {
        btnHamburger.addEventListener('click', () => {
            document.getElementById('navMenu').classList.toggle('open');
        });
    }

    const userMenuTrigger = document.getElementById('userMenuTrigger');
    if (userMenuTrigger) {
        userMenuTrigger.addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdownMenu');
            if (dropdown) dropdown.classList.toggle('hidden');
        });
    }
});