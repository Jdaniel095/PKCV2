document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar el torneo
    fetch("resultados.json")
        .then(res => res.json())
        .then(torneoData => {
            // 2. Cargar los Pokémon
            fetch("pokemon.json")
                .then(res => res.json())
                .then(pokemonData => iniciarRender(torneoData, pokemonData))
                .catch(err => {
                    console.warn("No se encontró pokemon.json, cargando sin nombres...", err);
                    iniciarRender(torneoData, null);
                });
        })
        .catch(err => {
            console.error("Error fatal: No se pudo cargar resultados.json", err);
        });
});

// Función para traducir el ID al nombre real usando tu pokemon.json
function getPokemonName(pokeId, pokemonData) {
    if (!pokeId) return "Desconocido";
    const idStr = String(pokeId);
    
    if (!pokemonData || !Array.isArray(pokemonData)) return idStr;
    
    // Busca exacto (ej. 1)
    let poke = pokemonData.find(p => String(p.dex) === idStr || String(p.id) === idStr);
    
    // Si tiene variante (ej. 979_a1), busca la base (979)
    if (!poke && idStr.includes('_')) {
        const baseId = idStr.split('_')[0];
        poke = pokemonData.find(p => String(p.dex) === baseId || String(p.id) === baseId);
    }

    if (poke) {
        // Tu JSON usa un formato de objeto para los idiomas
        if (poke.name && typeof poke.name === 'object') {
            return poke.name.es_419 || poke.name.es_ES || poke.name.en || idStr;
        }
        return poke.name || poke.pokemonName || idStr;
    }
    return idStr;
}

// Obtener la foto desde PokeAPI
function getPokemonSpriteUrl(pokeId) {
    if (!pokeId) return '';
    const num = pokeId.split('_')[0];
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`;
}

// Función que dibuja todo
function iniciarRender(data, pokemonData) {
    if (!data.torneo || !data.torneo.championId) return;

    // Quitar "Cargando..." y mostrar resultados
    const torneoInfo = document.getElementById('torneoInfo');
    if (torneoInfo) torneoInfo.style.display = 'none';
    const resultPhase = document.getElementById('resultPhase');
    if (resultPhase) resultPhase.style.display = 'block';

    const getPlayer = (id) => data.players.find(p => p.playerId === id);
    const champId = data.torneo.championId;
    const runnerId = data.torneo.runnerUpId;
    
    const finalMatch = data.matches.find(m => m.winnerId === champId && m.loserId === runnerId) || data.matches[data.matches.length - 1];
    const semiFinals = data.matches.filter(m => m.nextMatchId === finalMatch.matchId);
    
    let thirdId = "", fourthId = "";
    if (semiFinals.length === 2) {
        thirdId = semiFinals[0].loserId;
        fourthId = semiFinals[1].loserId;
    }

    const champ = getPlayer(champId);
    const runner = getPlayer(runnerId);
    const third = getPlayer(thirdId);
    const fourth = getPlayer(fourthId);

    // ===================================
    // 1. PODIO PREMIUM CON MONEDAS PNG
    // ===================================
    const podioContainer = document.getElementById('podio-container');
    if (podioContainer) {
        podioContainer.innerHTML = `
            <div class="pedestal silver">
                <div class="posicion">2</div>
                <div class="jugador-nombre">${runner ? runner.nick : '---'}</div>
                <div class="premio-pill">
                    <img src="coinplata.png" class="coin-img" alt="Plata" onerror="this.style.display='none'">
                    <span>21,100</span>
                </div>
            </div>
            
            <div class="pedestal gold">
                <div class="posicion">1</div>
                <div class="jugador-nombre">${champ ? champ.nick : '---'}</div>
                <div class="premio-pill" style="font-size: 1.1em;">
                    <img src="coindorada.png" class="coin-img" alt="Oro" onerror="this.style.display='none'">
                    <span>31,000</span>
                </div>
            </div>
            
            <div class="pedestal bronze">
                <div class="posicion">3</div>
                <div class="jugador-nombre">${third ? third.nick : '---'}</div>
                <div class="premio-pill">
                    <img src="coinbronce.png" class="coin-img" alt="Bronce" onerror="this.style.display='none'">
                    <span>15,500</span>
                </div>
            </div>
        `;
    }

    // ===================================
    // 2. CUARTO PUESTO
    // ===================================
    const cuartoContainer = document.getElementById('cuarto-puesto-container');
    if (cuartoContainer && fourth) {
        cuartoContainer.innerHTML = `
            <div class="fourth-card-new">
                <span class="puesto-label">4to Puesto:</span>
                <span class="jugador-nombre">${fourth.nick}</span>
                <div class="premio-pill"><span>S/ 50.00</span></div>
            </div>
        `;
    }

    // ===================================
    // 3. EQUIPO DEL CAMPEÓN
    // ===================================
    const champTeamContainer = document.getElementById('campeon-equipo-container');
    const tituloEquipoCampeon = document.getElementById('titulo-equipo-campeon');
    
    if (champ && tituloEquipoCampeon) {
        tituloEquipoCampeon.innerHTML = `🛡️ Equipo de <span style="color: white;">${champ.nick}</span>`;
    }

    if (champTeamContainer && champ && champ.team) {
        let teamHTML = '';
        champ.team.forEach(pokeId => {
            const pokeName = getPokemonName(pokeId, pokemonData);
            teamHTML += `
                <div class="pokemon-item">
                    <img src="${getPokemonSpriteUrl(pokeId)}" title="${pokeName}" alt="${pokeName}">
                    <span class="pokemon-name">${pokeName}</span>
                </div>
            `;
        });
        champTeamContainer.innerHTML = teamHTML;
    }

    // ===================================
    // 4. HISTORIAL DE VICTORIAS
    // ===================================
    const historialContainer = document.getElementById('historial-container');
    if (historialContainer && champ) {
        const champMatches = data.matches
            .filter(m => m.playerAId === champId || m.playerBId === champId)
            .sort((a, b) => a.round - b.round);
        
        let html = '';
        champMatches.forEach(m => {
            const isPlayerA = m.playerAId === champId;
            const oppId = isPlayerA ? m.playerBId : m.playerAId;
            const opp = getPlayer(oppId);
            
            const champScore = isPlayerA ? m.scoreA : m.scoreB;
            const oppScore = isPlayerA ? m.scoreB : m.scoreA;
            
            // Asignar el nombre correcto según el número de la ronda
            let roundName = "";
            switch(m.round) {
                case 1: roundName = "Ronda 1"; break;
                case 2: roundName = "Octavos de Final"; break;
                case 3: roundName = "Cuartos de Final"; break;
                case 4: roundName = "Semifinal"; break;
                case 5: roundName = "Gran Final"; break;
                default: roundName = `Ronda ${m.round}`;
            }

            let teamHTML = '';
            if (opp && opp.team) {
                opp.team.forEach(pokeId => {
                    const pokeName = getPokemonName(pokeId, pokemonData);
                    teamHTML += `
                        <div class="pokemon-item">
                            <img src="${getPokemonSpriteUrl(pokeId)}" title="${pokeName}" alt="${pokeName}">
                            <span class="pokemon-name">${pokeName}</span>
                        </div>
                    `;
                });
            }

            html += `
                <div class="history-match">
                    <div class="history-header">
                        <div class="history-round">${roundName}</div>
                        <div class="history-score">Victorias: ${champScore} - ${oppScore}</div>
                    </div>
                    <div class="history-content">
                        <div class="history-opp-name">vs ${opp ? opp.nick : 'Rival Desconocido'}</div>
                        <div class="history-team">${teamHTML}</div>
                    </div>
                </div>
            `;
        });
        historialContainer.innerHTML = html;
    }
}
